-- Supabase schema for Agon. Apply with `supabase db push` after linking a project.
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_user_profile();

create table if not exists public.qr_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  kind text not null,
  template text not null default 'glass',
  data text not null check (char_length(data) between 1 and 10000),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  scans integer not null default 0 check (scans >= 0),
  is_favorite boolean not null default false,
  encrypted boolean not null default false,
  expires_at timestamptz,
  one_time_scan boolean not null default false,
  password_protected boolean not null default false,
  qr_color text not null default '#7C3AED',
  bg_color text not null default '#FFFFFF',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.saved_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  url text not null check (char_length(url) between 1 and 4096),
  title text not null check (char_length(title) between 1 and 500),
  description text,
  category text not null default 'other',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  direction text not null check (direction in ('sent', 'received')),
  peer_name text not null default '',
  file_count integer not null default 0 check (file_count >= 0),
  total_bytes bigint not null default 0 check (total_bytes >= 0),
  status text not null check (status in ('completed', 'in-progress', 'failed', 'paused')),
  method text not null check (method in ('wifi-direct', 'hotspot', 'bluetooth')),
  files jsonb not null default '[]'::jsonb check (jsonb_typeof(files) = 'array'),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  source_lang text not null,
  target_lang text not null,
  original_text text not null check (char_length(original_text) <= 50000),
  translated_text text not null check (char_length(translated_text) <= 50000),
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  storage_path text not null unique,
  name text not null check (char_length(name) between 1 and 255),
  kind text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes between 0 and 104857600),
  modified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists qr_cards_user_created_idx on public.qr_cards (user_id, created_at desc);
create index if not exists saved_links_user_created_idx on public.saved_links (user_id, created_at desc);
create index if not exists transfers_user_started_idx on public.transfers (user_id, started_at desc);
create index if not exists translations_user_created_idx on public.translations (user_id, created_at desc);
create index if not exists files_user_created_idx on public.files (user_id, created_at desc);

alter table public.users enable row level security;
alter table public.qr_cards enable row level security;
alter table public.saved_links enable row level security;
alter table public.transfers enable row level security;
alter table public.translations enable row level security;
alter table public.files enable row level security;

create policy "Users can read their own profile"
  on public.users for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update their own profile"
  on public.users for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users manage their QR cards"
  on public.qr_cards for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their saved links"
  on public.saved_links for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their transfers"
  on public.transfers for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their translations"
  on public.translations for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their file metadata"
  on public.files for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-files', 'user-files', false, 104857600,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-powerpoint',
    'application/vnd.ms-excel',
    'application/zip',
    'application/vnd.android.package-archive',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm',
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/aac', 'audio/ogg',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users read files in their own folder"
  on storage.objects for select to authenticated
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload files in their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users update files in their own folder"
  on storage.objects for update to authenticated
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete files in their own folder"
  on storage.objects for delete to authenticated
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
