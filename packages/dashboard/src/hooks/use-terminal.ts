import { useCallback, useEffect, useRef, useState } from "react";

export interface TerminalStatus {
  pid: number;
  uptime: number;
  cwd: string;
  memoryMB: number;
  isActive: boolean;
  skipPermissions: boolean;
  alive: boolean;
}

interface UseTerminalOptions {
  autoSpawn?: boolean;
  skipPermissions?: boolean;
}

interface UseTerminalReturn {
  connected: boolean;
  status: TerminalStatus | null;
  exitCode: number | null;
  send: (msg: object) => void;
  spawn: (skipPermissions: boolean) => void;
  kill: () => void;
  resize: (cols: number, rows: number) => void;
  writeInput: (data: string) => void;
  onOutput: React.MutableRefObject<((data: string) => void) | null>;
  onScrollback: React.MutableRefObject<((data: string) => void) | null>;
}

const MAX_RETRIES = 10;
const RECONNECT_DELAY = 2000;

export function useTerminal(opts: UseTerminalOptions = {}): UseTerminalReturn {
  const { autoSpawn = false, skipPermissions = false } = opts;

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<TerminalStatus | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onOutput = useRef<((data: string) => void) | null>(null);
  const onScrollback = useRef<((data: string) => void) | null>(null);
  const autoSpawnRef = useRef(autoSpawn);
  const skipPermissionsRef = useRef(skipPermissions);

  autoSpawnRef.current = autoSpawn;
  skipPermissionsRef.current = skipPermissions;

  const send = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const spawn = useCallback((skip: boolean) => {
    send({ type: "spawn", skipPermissions: skip });
  }, [send]);

  const kill = useCallback(() => {
    send({ type: "kill" });
  }, [send]);

  const resize = useCallback((cols: number, rows: number) => {
    send({ type: "resize", cols, rows });
  }, [send]);

  const writeInput = useCallback((data: string) => {
    send({ type: "input", data });
  }, [send]);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/terminal`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        retriesRef.current = 0;

        if (autoSpawnRef.current) {
          // Auto-spawn if not already alive (status will tell us)
          ws.send(JSON.stringify({ type: "spawn", skipPermissions: skipPermissionsRef.current }));
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        wsRef.current = null;

        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current++;
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string);
          switch (msg.type) {
            case "output":
              onOutput.current?.(msg.data);
              break;
            case "scrollback":
              onScrollback.current?.(msg.data);
              break;
            case "status":
              setStatus(msg.status);
              break;
            case "exit":
              setExitCode(msg.code ?? 1);
              break;
            case "started":
              setExitCode(null);
              break;
          }
        } catch {
          // Ignore unparseable messages
        }
      };

      ws.onerror = () => {
        // Will trigger onclose
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    connected,
    status,
    exitCode,
    send,
    spawn,
    kill,
    resize,
    writeInput,
    onOutput,
    onScrollback,
  };
}
