import QRCodeEncoder from 'qrcode';

// Generate the encoded QR matrix with real error-correction and finder patterns.
export type QRMatrix = boolean[][];

export interface QRGenerateOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const generateQRMatrix = (data: string, opts: QRGenerateOptions = {}): QRMatrix => {
  const qr = QRCodeEncoder.create(data, {
    errorCorrectionLevel: opts.errorCorrectionLevel ?? 'H',
  });
  const size = qr.modules.size;

  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => qr.modules.get(x, y) === 1)
  );
};

export const getQRStats = (data: string): { moduleCount: number; errorLevel: string } => {
  const qr = QRCodeEncoder.create(data, { errorCorrectionLevel: 'H' });
  return {
    moduleCount: qr.modules.size ** 2,
    errorLevel: 'H',
  };
};
