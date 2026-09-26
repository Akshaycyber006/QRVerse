import { supabase } from '../lib/supabase';
import { addQRCard, QRCard, SavedLinkItem, TranslationRecord, TransferRecord, store } from '../store/store';

const requireSupabase = () => {
  if (!supabase) throw new Error('Cloud sync requires Supabase credentials.');
  return supabase;
};

export const createAndPersistQRCard = async (card: Omit<QRCard, 'id' | 'createdAt' | 'scans'>): Promise<QRCard> => {
  const localCard = addQRCard(card);
  return supabase ? saveQRCard(localCard) : localCard;
};

const qrFromRow = (row: any): QRCard => ({
  id: row.id, title: row.title, kind: row.kind, template: row.template, data: row.data,
  sizeBytes: Number(row.size_bytes), createdAt: new Date(row.created_at).getTime(), scans: row.scans,
  isFavorite: row.is_favorite, encrypted: row.encrypted, expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
  oneTimeScan: row.one_time_scan, passwordProtected: row.password_protected, qrColor: row.qr_color, bgColor: row.bg_color, tags: row.tags ?? [],
});

export const saveQRCard = async (card: QRCard): Promise<QRCard> => {
  const client = requireSupabase();
  const { data, error } = await client.from('qr_cards').insert({
    title: card.title, kind: card.kind, template: card.template, data: card.data, size_bytes: card.sizeBytes,
    scans: card.scans, is_favorite: card.isFavorite, encrypted: card.encrypted,
    expires_at: card.expiresAt ? new Date(card.expiresAt).toISOString() : null,
    one_time_scan: card.oneTimeScan, password_protected: card.passwordProtected,
    qr_color: card.qrColor, bg_color: card.bgColor, tags: card.tags,
  }).select('*').single();
  if (error) throw error;
  const saved = qrFromRow(data);
  store.setState(s => ({ qrCards: s.qrCards.map(item => item.id === card.id ? saved : item) }));
  return saved;
};

export const loadQRCards = async (): Promise<QRCard[]> => {
  const { data, error } = await requireSupabase().from('qr_cards').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const cards = (data ?? []).map(qrFromRow);
  store.setState({ qrCards: cards });
  return cards;
};

export const updateQRFavorite = async (id: string, isFavorite: boolean) => {
  const { error } = await requireSupabase().from('qr_cards').update({ is_favorite: isFavorite }).eq('id', id);
  if (error) throw error;
};

export const removeQRCard = async (id: string) => {
  const { error } = await requireSupabase().from('qr_cards').delete().eq('id', id);
  if (error) throw error;
};

const linkFromRow = (row: any): SavedLinkItem => ({
  id: row.id, url: row.url, title: row.title, description: row.description ?? undefined, previewImage: row.preview_image_url ?? undefined, category: row.category,
  favicon: row.favicon_url || 'link', tags: row.tags ?? [], isFavorite: row.is_favorite, savedAt: new Date(row.created_at).getTime(), clicks: row.clicks ?? 0,
});

export const saveLink = async (link: SavedLinkItem): Promise<SavedLinkItem> => {
  const { data, error } = await requireSupabase().from('saved_links').insert({
    url: link.url, title: link.title, description: link.description, category: link.category, tags: link.tags, is_favorite: link.isFavorite,
    favicon_url: link.favicon.startsWith('http') ? link.favicon : null,
    preview_image_url: link.previewImage ?? null,
  }).select('*').single();
  if (error) throw error;
  const saved = linkFromRow(data);
  store.setState(s => ({ savedLinks: s.savedLinks.map(item => item.id === link.id ? saved : item) }));
  return saved;
};

export const loadSavedLinks = async (): Promise<SavedLinkItem[]> => {
  const { data, error } = await requireSupabase().from('saved_links').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const links = (data ?? []).map(linkFromRow);
  store.setState({ savedLinks: links });
  return links;
};

export const updateLinkFavorite = async (id: string, isFavorite: boolean) => {
  const { error } = await requireSupabase().from('saved_links').update({ is_favorite: isFavorite }).eq('id', id);
  if (error) throw error;
};

export const removeLink = async (id: string) => {
  const { error } = await requireSupabase().from('saved_links').delete().eq('id', id);
  if (error) throw error;
};

export const saveTranslation = async (record: TranslationRecord) => {
  const { error } = await requireSupabase().from('translations').insert({
    source_lang: record.sourceLang, target_lang: record.targetLang,
    original_text: record.originalText, translated_text: record.translatedText,
  });
  if (error) throw error;
};

export const loadTranslations = async (): Promise<TranslationRecord[]> => {
  const { data, error } = await requireSupabase().from('translations').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const records: TranslationRecord[] = (data ?? []).map(row => ({
    id: row.id, sourceLang: row.source_lang, targetLang: row.target_lang,
    originalText: row.original_text, translatedText: row.translated_text,
    detectedAt: new Date(row.created_at).getTime(),
  }));
  store.setState({ translations: records });
  return records;
};

export const saveTransfer = async (record: TransferRecord) => {
  const { error } = await requireSupabase().from('transfers').insert({
    direction: record.direction, peer_name: record.peerName, file_count: record.fileCount,
    total_bytes: record.totalBytes, status: record.status, method: record.method,
    files: record.files, completed_at: record.completedAt ? new Date(record.completedAt).toISOString() : null,
  });
  if (error) throw error;
};

export const loadTransfers = async (): Promise<TransferRecord[]> => {
  const { data, error } = await requireSupabase().from('transfers').select('*').order('started_at', { ascending: false });
  if (error) throw error;
  const transfers: TransferRecord[] = (data ?? []).map(row => ({
    id: row.id, direction: row.direction, peerName: row.peer_name, fileCount: row.file_count,
    totalBytes: Number(row.total_bytes), status: row.status, method: row.method,
    files: row.files ?? [], startedAt: new Date(row.started_at).getTime(),
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
  }));
  store.setState({ transfers });
  return transfers;
};
