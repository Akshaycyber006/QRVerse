-- Add preview metadata and pairing metadata without replacing user data.
alter table public.saved_links
  add column if not exists favicon_url text,
  add column if not exists preview_image_url text,
  add column if not exists clicks integer not null default 0 check (clicks >= 0);

alter table public.translations
  add column if not exists image_path text;

alter table public.saved_links enable row level security;
alter table public.transfers enable row level security;
alter table public.translations enable row level security;
