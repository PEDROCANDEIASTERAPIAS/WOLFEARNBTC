import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeImageProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeImage({ value, size = 200, className = '' }: QRCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#0F1115',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`animate-pulse rounded-xl bg-ink-800 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
    />
  );
}
