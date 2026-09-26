import { Platform } from 'react-native';
import QRCodeEncoder from 'qrcode';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

const downloadWeb = (dataUrl: string, filename: string) => {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

export const exportQrSvg = async (data: string, filename: string) => {
  const svg = await QRCodeEncoder.toString(data, { type: 'svg', errorCorrectionLevel: 'H', margin: 4, width: 1024 });
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    downloadWeb(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, filename);
  file.write(svg);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'image/svg+xml', dialogTitle: 'Share QR as SVG' });
};

export const exportQrPng = async (data: string, filename: string, capture: () => Promise<string>) => {
  if (Platform.OS === 'web') {
    const dataUrl = await QRCodeEncoder.toDataURL(data, { errorCorrectionLevel: 'H', margin: 4, width: 1024 });
    downloadWeb(dataUrl, filename);
    return dataUrl;
  }
  const uri = await capture();
  const file = new File(uri);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: filename });
  return file.uri;
};
