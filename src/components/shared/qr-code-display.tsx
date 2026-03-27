"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps): React.ReactNode {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark: "#1e293b", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setDataUrl).catch(() => {});
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div className="animate-pulse bg-slate-100 rounded-xl" style={{ width: size, height: size }} />
    );
  }

  return (
    <img src={dataUrl} alt="QR Code" width={size} height={size} className="rounded-xl" />
  );
}
