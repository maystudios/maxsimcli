import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface ServerInfo {
  networkEnabled: boolean;
  localUrl: string;
  networkUrl: string | null;
}

export function NetworkQRButton() {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/server-info")
      .then((r) => r.json())
      .then((data: ServerInfo) => setServerInfo(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (serverInfo?.networkUrl) {
      QRCode.toDataURL(serverInfo.networkUrl, { width: 200, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [serverInfo?.networkUrl]);

  if (!serverInfo?.networkEnabled || !serverInfo.networkUrl) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 rounded-lg border border-border bg-background p-4 shadow-xl">
          <p className="mb-1 font-mono text-[10px] text-muted-foreground">Local Network</p>
          <p className="mb-3 font-mono text-xs text-foreground">{serverInfo.networkUrl}</p>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR code for local network access"
              width={200}
              height={200}
              className="rounded-sm"
            />
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={open ? "Close QR code" : "Open on another device"}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground shadow-md transition-colors hover:bg-muted"
      >
        <QRIcon />
        Share
      </button>
    </div>
  );
}

function QRIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <line x1="14" y1="20" x2="20" y2="20" />
      <line x1="20" y1="14" x2="20" y2="17" />
    </svg>
  );
}
