import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { FileKind } from '../components/FileIcon';
import { uid } from '../utils/helpers';

export type QRTemplate = 'minimal' | 'glass' | 'neon' | 'corporate' | 'gold' | 'dark' | 'festival';

export interface QRCard {
  id: string;
  title: string;
  kind: FileKind;
  template: QRTemplate;
  data: string;
  sizeBytes: number;
  createdAt: number;
  scans: number;
  isFavorite: boolean;
  encrypted: boolean;
  expiresAt?: number;
  oneTimeScan: boolean;
  passwordProtected: boolean;
  qrColor: string;
  bgColor: string;
  tags: string[];
}

export interface TransferRecord {
  id: string;
  direction: 'sent' | 'received';
  peerName: string;
  fileCount: number;
  totalBytes: number;
  status: 'completed' | 'in-progress' | 'failed' | 'paused';
  startedAt: number;
  completedAt?: number;
  method: 'wifi-direct' | 'hotspot' | 'bluetooth';
  files: { name: string; sizeBytes: number; kind: FileKind }[];
}

export interface SavedLinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  previewImage?: string;
  category: 'github' | 'youtube' | 'instagram' | 'linkedin' | 'gdrive' | 'shopping' | 'college' | 'article' | 'other';
  favicon: string;
  tags: string[];
  isFavorite: boolean;
  savedAt: number;
  clicks: number;
}

export interface Meeting {
  id: string;
  title: string;
  hostName: string;
  scheduledAt: number;
  duration: number; // minutes
  participants: number;
  joinCode: string;
  status: 'upcoming' | 'live' | 'ended';
}

export interface TranslationRecord {
  id: string;
  sourceLang: string;
  targetLang: string;
  originalText: string;
  translatedText: string;
  detectedAt: number;
  imageUri?: string;
}

export interface FileItem {
  id: string;
  name: string;
  kind: FileKind;
  sizeBytes: number;
  modifiedAt: number;
  path: string;
  isDuplicate: boolean;
  isLarge: boolean;
  hidden: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'transfer' | 'meeting' | 'translation' | 'qr' | 'storage';
  read: boolean;
  createdAt: number;
}

// ---- Seed Data ----
const seedQRCards = (): QRCard[] => [
  {
    id: 'qr_seed_1',
    title: 'Q3 Product Roadmap.pdf',
    kind: 'pdf',
    template: 'glass',
    data: 'https://qrverse.app/c/roadmap-q3-pdf',
    sizeBytes: 4_580_000,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    scans: 24,
    isFavorite: true,
    encrypted: true,
    oneTimeScan: false,
    passwordProtected: false,
    qrColor: '#7C3AED',
    bgColor: '#F3F0FF',
    tags: ['work', 'strategy'],
  },
  {
    id: 'qr_seed_2',
    title: 'Office Wi-Fi',
    kind: 'wifi',
    template: 'neon',
    data: 'WIFI:S:QRVerse-Office;T:WPA;P:Welcome2026;;',
    sizeBytes: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 28,
    scans: 142,
    isFavorite: true,
    encrypted: false,
    oneTimeScan: false,
    passwordProtected: false,
    qrColor: '#06B6D4',
    bgColor: '#0F1A2E',
    tags: ['office', 'network'],
  },
  {
    id: 'qr_seed_3',
    title: 'Instagram @qrverse',
    kind: 'instagram',
    template: 'gold',
    data: 'https://instagram.com/qrverse',
    sizeBytes: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 50,
    scans: 89,
    isFavorite: false,
    encrypted: false,
    oneTimeScan: false,
    passwordProtected: false,
    qrColor: '#D97706',
    bgColor: '#FEF3C7',
    tags: ['social'],
  },
  {
    id: 'qr_seed_4',
    title: 'Team Sync — Friday',
    kind: 'meeting',
    template: 'minimal',
    data: 'qrverse://meeting/J7K2-MEET',
    sizeBytes: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    scans: 12,
    isFavorite: false,
    encrypted: true,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    oneTimeScan: false,
    passwordProtected: true,
    qrColor: '#6366F1',
    bgColor: '#FFFFFF',
    tags: ['team'],
  },
];

const seedTransfers = (): TransferRecord[] => [
  {
    id: 'tr_seed_1',
    direction: 'sent',
    peerName: 'Arjun’s iPhone',
    fileCount: 12,
    totalBytes: 184_320_000,
    status: 'completed',
    startedAt: Date.now() - 1000 * 60 * 45,
    completedAt: Date.now() - 1000 * 60 * 42,
    method: 'wifi-direct',
    files: [
      { name: 'Design-System.fig', sizeBytes: 84_000_000, kind: 'image' },
      { name: 'Brand-Guidelines.pdf', sizeBytes: 24_000_000, kind: 'pdf' },
      { name: 'assets.zip', sizeBytes: 76_320_000, kind: 'zip' },
    ],
  },
  {
    id: 'tr_seed_2',
    direction: 'received',
    peerName: 'Priya',
    fileCount: 3,
    totalBytes: 14_500_000,
    status: 'completed',
    startedAt: Date.now() - 1000 * 60 * 60 * 6,
    completedAt: Date.now() - 1000 * 60 * 60 * 6 + 22_000,
    method: 'hotspot',
    files: [
      { name: 'menu-jp.jpg', sizeBytes: 3_200_000, kind: 'image' },
      { name: 'translation.txt', sizeBytes: 4_000, kind: 'text' },
      { name: 'recording.m4a', sizeBytes: 11_300_000, kind: 'audio' },
    ],
  },
];

const seedMeetings = (): Meeting[] => [
  {
    id: 'mt_1',
    title: 'Product Weekly Sync',
    hostName: 'You',
    scheduledAt: Date.now() + 1000 * 60 * 60 * 4,
    duration: 45,
    participants: 8,
    joinCode: 'J7K2-MEET',
    status: 'upcoming',
  },
  {
    id: 'mt_2',
    title: 'Design Critique — Onboarding',
    hostName: 'Mira Kapoor',
    scheduledAt: Date.now() + 1000 * 60 * 60 * 26,
    duration: 60,
    participants: 5,
    joinCode: 'MIRA-9X4',
    status: 'upcoming',
  },
];

const seedLinks = (): SavedLinkItem[] => [
  {
    id: 'lk_1',
    url: 'https://github.com/qrverse/qrverse-core',
    title: 'qrverse/qrverse-core',
    description: 'Open source core for QRVerse. MIT licensed.',
    category: 'github',
    favicon: '🐙',
    tags: ['repo', 'open-source'],
    isFavorite: true,
    savedAt: Date.now() - 1000 * 60 * 60 * 10,
    clicks: 14,
  },
  {
    id: 'lk_2',
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Designing Premium Mobile Apps',
    description: 'A deep dive into Apple-grade design systems.',
    category: 'youtube',
    favicon: '▶️',
    tags: ['design', 'video'],
    isFavorite: false,
    savedAt: Date.now() - 1000 * 60 * 60 * 36,
    clicks: 3,
  },
  {
    id: 'lk_3',
    url: 'https://instagram.com/qrverse',
    title: '@qrverse on Instagram',
    category: 'instagram',
    favicon: '📷',
    tags: ['social'],
    isFavorite: false,
    savedAt: Date.now() - 1000 * 60 * 60 * 80,
    clicks: 5,
  },
];

const seedFiles = (): FileItem[] => [
  { id: 'f_1', name: 'Project Brief.pdf', kind: 'pdf', sizeBytes: 2_300_000, modifiedAt: Date.now() - 1000 * 60 * 60 * 24, path: '/Documents', isDuplicate: false, isLarge: false, hidden: false },
  { id: 'f_2', name: 'Screenshots.zip', kind: 'zip', sizeBytes: 84_000_000, modifiedAt: Date.now() - 1000 * 60 * 60 * 48, path: '/Downloads', isDuplicate: false, isLarge: true, hidden: false },
  { id: 'f_3', name: 'demo-video.mp4', kind: 'video', sizeBytes: 184_000_000, modifiedAt: Date.now() - 1000 * 60 * 60 * 3, path: '/Movies', isDuplicate: false, isLarge: true, hidden: false },
  { id: 'f_4', name: 'voice-note.m4a', kind: 'audio', sizeBytes: 1_400_000, modifiedAt: Date.now() - 1000 * 60 * 30, path: '/Audio', isDuplicate: false, isLarge: false, hidden: false },
  { id: 'f_5', name: 'duplicate-photo.jpg', kind: 'image', sizeBytes: 3_400_000, modifiedAt: Date.now() - 1000 * 60 * 60 * 5, path: '/Photos', isDuplicate: true, isLarge: false, hidden: false },
  { id: 'f_6', name: 'react-native.apk', kind: 'apk', sizeBytes: 64_000_000, modifiedAt: Date.now() - 1000 * 60 * 60 * 72, path: '/Downloads', isDuplicate: false, isLarge: true, hidden: false },
];

const seedNotifications = (): Notification[] => [
  { id: 'n_1', title: 'Transfer Complete', message: '12 files sent to Arjun’s iPhone in 3m 12s', type: 'transfer', read: false, createdAt: Date.now() - 1000 * 60 * 45 },
  { id: 'n_2', title: 'Meeting Starting Soon', message: 'Product Weekly Sync in 4 hours', type: 'meeting', read: false, createdAt: Date.now() - 1000 * 60 * 15 },
  { id: 'n_3', title: 'Translation Saved', message: 'Japanese menu → English', type: 'translation', read: true, createdAt: Date.now() - 1000 * 60 * 60 * 6 },
];

// ---- Store ----
export interface AppState {
  qrCards: QRCard[];
  transfers: TransferRecord[];
  meetings: Meeting[];
  savedLinks: SavedLinkItem[];
  translations: TranslationRecord[];
  files: FileItem[];
  notifications: Notification[];
}

let _state: AppState = {
  qrCards: [],
  transfers: [],
  meetings: [],
  savedLinks: [],
  translations: [],
  files: [],
  notifications: [],
};

const listeners = new Set<() => void>();
const STORAGE_KEY = 'agon-app-state-v1';
const stateKeys: (keyof AppState)[] = ['qrCards', 'transfers', 'meetings', 'savedLinks', 'translations', 'files', 'notifications'];
let hydrated = false;
let hydrationPromise: Promise<void> | undefined;
let persistenceQueue = Promise.resolve();

const isAppState = (value: unknown): value is AppState => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<keyof AppState, unknown>;
  return stateKeys.every(key => Array.isArray(candidate[key]));
};

export const hydrateStore = (): Promise<void> => {
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isAppState(parsed)) _state = parsed;
      }
    } catch {}
    hydrated = true;
    listeners.forEach(listener => listener());
  })();

  return hydrationPromise;
};

export const clearLocalStore = async (): Promise<void> => {
  await persistenceQueue.catch(() => undefined);
  _state = {
    qrCards: [],
    transfers: [],
    meetings: [],
    savedLinks: [],
    translations: [],
    files: [],
    notifications: [],
  };
  listeners.forEach(listener => listener());
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export const replaceFiles = (files: FileItem[]) => {
  store.setState({ files });
};

export const addUploadedFile = (file: FileItem) => {
  store.setState(state => ({ files: [file, ...state.files] }));
};

export const removeUploadedFile = (id: string) => {
  store.setState(state => ({ files: state.files.filter(file => file.id !== id) }));
};

export const store = {
  getState: () => _state,
  subscribe: (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  setState: (updater: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
    const patch = typeof updater === 'function' ? updater(_state) : updater;
    _state = { ..._state, ...patch };
    if (hydrated) {
      const serialized = JSON.stringify(_state);
      persistenceQueue = persistenceQueue
        .then(() => AsyncStorage.setItem(STORAGE_KEY, serialized))
        .catch(() => {});
    }
    listeners.forEach(l => l());
  },
};

export const useStore = <T,>(selector: (s: AppState) => T): T => {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
};

// ---- Actions ----
export const addQRCard = (card: Omit<QRCard, 'id' | 'createdAt' | 'scans'>): QRCard => {
  const newCard: QRCard = {
    ...card,
    id: uid('qr'),
    createdAt: Date.now(),
    scans: 0,
  };
  store.setState(s => ({ qrCards: [newCard, ...s.qrCards] }));
  return newCard;
};

export const toggleFavoriteQR = (id: string) => {
  store.setState(s => ({
    qrCards: s.qrCards.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c),
  }));
};

export const deleteQRCard = (id: string) => {
  store.setState(s => ({ qrCards: s.qrCards.filter(c => c.id !== id) }));
};

export const incrementScan = (id: string) => {
  store.setState(s => ({
    qrCards: s.qrCards.map(c => c.id === id ? { ...c, scans: c.scans + 1 } : c),
  }));
};

export const addTransfer = (record: Omit<TransferRecord, 'id' | 'startedAt'>): TransferRecord => {
  const rec: TransferRecord = { ...record, id: uid('tr'), startedAt: Date.now() };
  store.setState(s => ({ transfers: [rec, ...s.transfers] }));
  return rec;
};

export const updateTransfer = (id: string, patch: Partial<TransferRecord>) => {
  store.setState(s => ({ transfers: s.transfers.map(t => t.id === id ? { ...t, ...patch } : t) }));
};

export const addLink = (link: Omit<SavedLinkItem, 'id' | 'savedAt' | 'clicks'>): SavedLinkItem => {
  const item: SavedLinkItem = { ...link, id: uid('lk'), savedAt: Date.now(), clicks: 0 };
  store.setState(s => ({ savedLinks: [item, ...s.savedLinks] }));
  return item;
};

export const deleteLink = (id: string) => {
  store.setState(s => ({ savedLinks: s.savedLinks.filter(l => l.id !== id) }));
};

export const toggleFavoriteLink = (id: string) => {
  store.setState(s => ({
    savedLinks: s.savedLinks.map(l => l.id === id ? { ...l, isFavorite: !l.isFavorite } : l),
  }));
};

export const addMeeting = (m: Omit<Meeting, 'id'>): Meeting => {
  const item: Meeting = { ...m, id: uid('mt') };
  store.setState(s => ({ meetings: [item, ...s.meetings] }));
  return item;
};

export const addTranslation = (t: Omit<TranslationRecord, 'id' | 'detectedAt'>): TranslationRecord => {
  const item: TranslationRecord = { ...t, id: uid('trn'), detectedAt: Date.now() };
  store.setState(s => ({ translations: [item, ...s.translations] }));
  return item;
};

export const markNotificationRead = (id: string) => {
  store.setState(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  }));
};

export const clearAllNotifications = () => {
  store.setState({ notifications: [] });
};
