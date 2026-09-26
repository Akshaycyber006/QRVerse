import { File as ExpoFile } from 'expo-file-system';
import type { DocumentPickerAsset } from 'expo-document-picker';
import type { FileKind } from '../components/FileIcon';
import type { FileItem } from '../store/store';
import { supabase } from '../lib/supabase';
import { uid } from '../utils/helpers';

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const TUS_CHUNK_BYTES = 6 * 1024 * 1024;

const FILE_TYPES: Record<string, { kind: FileKind; mime: string }> = {
  pdf: { kind: 'pdf', mime: 'application/pdf' },
  doc: { kind: 'docx', mime: 'application/msword' },
  docx: { kind: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  ppt: { kind: 'ppt', mime: 'application/vnd.ms-powerpoint' },
  pptx: { kind: 'ppt', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  xls: { kind: 'xls', mime: 'application/vnd.ms-excel' },
  xlsx: { kind: 'xls', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  zip: { kind: 'zip', mime: 'application/zip' },
  apk: { kind: 'apk', mime: 'application/vnd.android.package-archive' },
  jpg: { kind: 'image', mime: 'image/jpeg' },
  jpeg: { kind: 'image', mime: 'image/jpeg' },
  png: { kind: 'image', mime: 'image/png' },
  gif: { kind: 'image', mime: 'image/gif' },
  webp: { kind: 'image', mime: 'image/webp' },
  heic: { kind: 'image', mime: 'image/heic' },
  heif: { kind: 'image', mime: 'image/heif' },
  mp4: { kind: 'video', mime: 'video/mp4' },
  mov: { kind: 'video', mime: 'video/quicktime' },
  m4v: { kind: 'video', mime: 'video/x-m4v' },
  webm: { kind: 'video', mime: 'video/webm' },
  mp3: { kind: 'audio', mime: 'audio/mpeg' },
  m4a: { kind: 'audio', mime: 'audio/mp4' },
  wav: { kind: 'audio', mime: 'audio/wav' },
  aac: { kind: 'audio', mime: 'audio/aac' },
  ogg: { kind: 'audio', mime: 'audio/ogg' },
  txt: { kind: 'text', mime: 'text/plain' },
};

interface StoredFileRow {
  id: string;
  name: string;
  kind: FileKind;
  size_bytes: number;
  storage_path: string;
  modified_at: string;
}

const toFileItem = (row: StoredFileRow): FileItem => ({
  id: row.id,
  name: row.name,
  kind: row.kind,
  sizeBytes: Number(row.size_bytes),
  modifiedAt: new Date(row.modified_at).getTime(),
  path: row.storage_path,
  isDuplicate: false,
  isLarge: Number(row.size_bytes) >= 20 * 1024 * 1024,
  hidden: false,
});

const requireClient = () => {
  if (!supabase) throw new Error('Cloud uploads are not configured. Add the Supabase keys and restart the app.');
  return supabase;
};

const base64Ascii = (value: string): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < value.length; index += 3) {
    const first = value.charCodeAt(index);
    const hasSecond = index + 1 < value.length;
    const hasThird = index + 2 < value.length;
    const second = hasSecond ? value.charCodeAt(index + 1) : 0;
    const third = hasThird ? value.charCodeAt(index + 2) : 0;
    output += alphabet[first >> 2];
    output += alphabet[((first & 3) << 4) | (second >> 4)];
    output += hasSecond ? alphabet[((second & 15) << 2) | (third >> 6)] : '=';
    output += hasThird ? alphabet[third & 63] : '=';
  }
  return output;
};

const retryDelay = (attempt: number) => new Promise(resolve => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 10000)));

const uploadResumable = async (
  file: Blob,
  storagePath: string,
  contentType: string,
  accessToken: string,
): Promise<void> => {
  const client = requireClient();
  if (!client) throw new Error('Cloud storage is not configured.');
  const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!.replace(/\/$/, '');
  const storageBase = projectUrl.replace(/^(https?:\/\/[^.]+)\.supabase\.co$/, '$1.storage.supabase.co');
  const endpoint = `${storageBase.replace(/\/$/, '')}/storage/v1/upload/resumable`;
  const metadata = [
    `bucketName ${base64Ascii('user-files')}`,
    `objectName ${base64Ascii(storagePath)}`,
    `contentType ${base64Ascii(contentType)}`,
    `cacheControl ${base64Ascii('3600')}`,
  ].join(',');
  const created = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      authorization: `Bearer ${accessToken}`,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(file.size),
      'Upload-Metadata': metadata,
      'x-upsert': 'false',
    },
  });
  if (!created.ok) throw new Error(`Storage rejected the upload (${created.status}).`);
  const location = created.headers.get('Location');
  if (!location) throw new Error('Storage did not return a resumable upload URL.');
  const uploadUrl = new URL(location, endpoint).toString();

  let offset = 0;
  while (offset < file.size) {
    const end = Math.min(offset + TUS_CHUNK_BYTES, file.size);
    const chunk = await file.slice(offset, end).arrayBuffer();
    let uploaded = false;
    for (let attempt = 0; attempt < 5 && !uploaded; attempt += 1) {
      try {
        const response = await fetch(uploadUrl, {
          method: 'PATCH',
          headers: {
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            authorization: `Bearer ${accessToken}`,
            'Tus-Resumable': '1.0.0',
            'Upload-Offset': String(offset),
            'Content-Type': 'application/offset+octet-stream',
          },
          body: chunk,
        });
        if (response.ok) {
          const nextOffset = Number(response.headers.get('Upload-Offset'));
          if (!Number.isFinite(nextOffset) || nextOffset !== end) {
            throw new Error('Storage returned an unexpected upload offset.');
          }
          offset = nextOffset;
          uploaded = true;
          continue;
        }
        if (response.status < 500 && response.status !== 429) {
          throw new Error(`Storage upload failed (${response.status}).`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Storage upload failed (')) throw error;
      }

      if (attempt === 4) throw new Error('Upload interrupted after several retries. Check your connection and try again.');
      await retryDelay(attempt);
      const head = await fetch(uploadUrl, {
        method: 'HEAD',
        headers: {
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          authorization: `Bearer ${accessToken}`,
          'Tus-Resumable': '1.0.0',
        },
      });
      if (!head.ok) throw new Error('The upload session expired. Please select the file again.');
      const serverOffset = Number(head.headers.get('Upload-Offset'));
      if (!Number.isFinite(serverOffset) || serverOffset < 0 || serverOffset > file.size) {
        throw new Error('Storage returned an invalid upload position.');
      }
      if (serverOffset > offset) uploaded = true;
      offset = serverOffset;
    }
  }
};

const classify = (asset: DocumentPickerAsset) => {
  const extension = asset.name.split('.').pop()?.toLowerCase() ?? '';
  const type = FILE_TYPES[extension];
  if (!type) throw new Error(`“${asset.name}” is not a supported file type.`);
  const reportedType = asset.mimeType?.split(';')[0].toLowerCase();
  const typeAliases: Record<string, string> = {
    'image/jpg': 'image/jpeg',
    'application/x-zip-compressed': 'application/zip',
    'audio/x-m4a': 'audio/mp4',
    'video/x-quicktime': 'video/quicktime',
  };
  if (reportedType && reportedType !== 'application/octet-stream' && (typeAliases[reportedType] ?? reportedType) !== type.mime) {
    throw new Error(`The file type reported for “${asset.name}” does not match its extension.`);
  }
  return type;
};

export const uploadPickedFile = async (asset: DocumentPickerAsset): Promise<FileItem> => {
  const client = requireClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (sessionError || !user) throw new Error('Sign in again before uploading a file.');

  const fileType = classify(asset);
  const contentType = fileType.mime;
  const fileBody = asset.file ?? new ExpoFile(asset.uri);
  const fileSize = asset.size || asset.file?.size || fileBody.size;
  if (fileSize > MAX_UPLOAD_BYTES) throw new Error('Each file must be 100 MiB or smaller.');
  if (!fileSize || fileSize < 0) throw new Error('The selected file is empty or its size could not be read.');

  const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180);
  const storagePath = `${user.id}/${uid('file')}-${safeName}`;
  await uploadResumable(fileBody, storagePath, contentType, sessionData.session!.access_token);

  const modifiedAt = asset.lastModified ? new Date(asset.lastModified).toISOString() : new Date().toISOString();
  const { data: row, error: metadataError } = await client
    .from('files')
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      name: asset.name,
      kind: fileType.kind,
      content_type: contentType,
      size_bytes: fileSize,
      modified_at: modifiedAt,
    })
    .select('id,name,kind,size_bytes,storage_path,modified_at')
    .single();

  if (metadataError) {
    try {
      await client.storage.from('user-files').remove([storagePath]);
    } catch {
      // Leave the upload intact if cleanup is unavailable; the error below remains visible.
    }
    throw new Error(`File uploaded, but its metadata could not be saved: ${metadataError.message}`);
  }
  return toFileItem(row as StoredFileRow);
};

export const listUploadedFiles = async (): Promise<FileItem[]> => {
  const client = requireClient();
  const { data, error } = await client
    .from('files')
    .select('id,name,kind,size_bytes,storage_path,modified_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as StoredFileRow[]).map(toFileItem);
};

export const deleteUploadedFile = async (fileId: string, storagePath: string): Promise<void> => {
  const client = requireClient();
  const { error: removeError } = await client.storage.from('user-files').remove([storagePath]);
  if (removeError) throw removeError;
  const { error: rowError } = await client.from('files').delete().eq('id', fileId);
  if (rowError) throw rowError;
};
