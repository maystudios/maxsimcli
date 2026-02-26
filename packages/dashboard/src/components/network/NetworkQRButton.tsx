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
      QRCode.toDataURL(serverInfo.networkUrl, { width: 192, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [serverInfo?.networkUrl]);

  if (!serverInfo?.networkEnabled || !serverInfo.networkUrl) return null;

  return (
    <div className="relative border-t border-border px-1 py-2">
      {/* QR popup — appears above the button */}
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-2 rounded-lg border border-border bg-card p-3 shadow-xl">
          <p className="mb-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            Local Network
          </p>
          <p className="mb-3 font-mono text-[11px] break-all text-foreground">
            {serverInfo.networkUrl}
          </p>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR code for local network access"
              width={192}
              height={192}
              className="w-full rounded-sm"
            />
          )}
          <p className="mt-2 font-mono text-[9px] text-muted-foreground">
            Scan to open on another device
          </p>
        </div>
      )}

      {/* Sidebar-style button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={open ? "Close QR code" : "Open dashboard on another device"}
        className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-card-hover text-muted-foreground"
      >
        <QRIcon />
        <span className="font-mono text-xs uppercase tracking-wide">
          Share
        </span>
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
