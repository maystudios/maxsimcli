import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface ServerInfo {
  networkEnabled: boolean;
  localUrl: string;
  networkUrl: string | null;
  tailscaleUrl: string | null;
}

export function NetworkQRButton() {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [tailscaleQr, setTailscaleQr] = useState<string | null>(null);
  const [lanQr, setLanQr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/server-info")
      .then((r) => r.json())
      .then((data: ServerInfo) => setServerInfo(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (serverInfo?.tailscaleUrl) {
      QRCode.toDataURL(serverInfo.tailscaleUrl, { width: 192, margin: 2 })
        .then(setTailscaleQr)
        .catch(() => {});
    }
    if (serverInfo?.networkUrl) {
      QRCode.toDataURL(serverInfo.networkUrl, { width: 192, margin: 2 })
        .then(setLanQr)
        .catch(() => {});
    }
  }, [serverInfo?.tailscaleUrl, serverInfo?.networkUrl]);

  const hasTailscale = !!serverInfo?.tailscaleUrl;
  const hasLan = !!serverInfo?.networkUrl;
  const hasAnySharing = hasTailscale || hasLan;

  return (
    <div className="relative border-t border-border px-1 py-2">
      {/* Popup — appears above the button */}
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-2 border border-border bg-card shadow-xl">
          {hasTailscale && (
            <div className="p-3">
              {/* Tailscale header */}
              <div className="mb-2 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 bg-success" />
                <p className="font-mono text-[9px] uppercase tracking-widest text-success">
                  Tailscale — Secure
                </p>
              </div>
              <p className="mb-3 break-all font-mono text-[11px] text-foreground">
                {serverInfo!.tailscaleUrl}
              </p>
              {tailscaleQr && (
                <img
                  src={tailscaleQr}
                  alt="QR code for Tailscale access"
                  width={192}
                  height={192}
                  className="w-full"
                />
              )}
              <p className="mt-2 font-mono text-[9px] text-muted-foreground">
                Only visible to your Tailscale devices
              </p>
            </div>
          )}

          {hasLan && (
            <div className={`p-3 ${hasTailscale ? "border-t border-border" : ""}`}>
              <p className="mb-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Local Network
              </p>
              <p className="mb-3 break-all font-mono text-[11px] text-foreground">
                {serverInfo!.networkUrl}
              </p>
              {lanQr && (
                <img
                  src={lanQr}
                  alt="QR code for local network access"
                  width={192}
                  height={192}
                  className="w-full"
                />
              )}
              <p className="mt-2 font-mono text-[9px] text-muted-foreground">
                Anyone on your local network can access this
              </p>
            </div>
          )}

          {!hasAnySharing && (
            <div className="p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 bg-muted-foreground" />
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  Remote Access
                </p>
              </div>
              <p className="mb-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                Install Tailscale on this device and your phone to securely access the dashboard from anywhere — no port forwarding, no public URLs.
              </p>
              <a
                href="https://tailscale.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full border border-border px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Get Tailscale →
              </a>
              <p className="mt-2 font-mono text-[9px] text-muted-foreground">
                Free · E2E encrypted · No account sharing
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sidebar button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={
          hasTailscale
            ? "Open on another device via Tailscale"
            : hasLan
              ? "Open on another device via local network"
              : "Set up remote access"
        }
        className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-card-hover text-muted-foreground"
      >
        <ShareIcon active={hasTailscale} />
        <span className="font-mono text-xs uppercase tracking-wide">
          Share
        </span>
        {hasTailscale && (
          <span className="ml-auto inline-block h-1.5 w-1.5 bg-success" />
        )}
      </button>
    </div>
  );
}

function ShareIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "currentColor" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
