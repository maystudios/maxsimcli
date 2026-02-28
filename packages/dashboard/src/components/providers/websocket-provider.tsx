import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from "react";
import type { DiscussionQuestion } from "./discussion-provider";

interface LifecycleEvent {
  event_type: string;
  phase_name?: string;
  phase_number?: string;
  step?: number;
  total_steps?: number;
}

interface WSContextValue {
  connected: boolean;
  lastChange: number;
  lifecycleEvent: LifecycleEvent | null;
  pendingQuestionCount: number;
  onQuestionReceivedRef: MutableRefObject<((questions: DiscussionQuestion[]) => void) | null>;
}

const WSContext = createContext<WSContextValue>({
  connected: false,
  lastChange: 0,
  lifecycleEvent: null,
  pendingQuestionCount: 0,
  onQuestionReceivedRef: { current: null },
});

const INITIAL_RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 1.5;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastChange, setLastChange] = useState(0);
  const [lifecycleEvent, setLifecycleEvent] = useState<LifecycleEvent | null>(null);
  const [pendingQuestionCount, setPendingQuestionCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const onQuestionReceivedRef = useRef<((questions: DiscussionQuestion[]) => void) | null>(null);

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;

        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(
          delay * RECONNECT_MULTIPLIER,
          MAX_RECONNECT_DELAY
        );

        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          switch (data.type) {
            case "file-changes":
              if (typeof data.timestamp === "number") {
                setLastChange(data.timestamp);
              }
              break;

            case "question-received": {
              const sq = data.question;
              const dq: DiscussionQuestion = {
                id: sq.id,
                header: "Question",
                question: sq.question,
                multiSelect: false,
                options: (sq.options || []).map((o: { value: string; label: string; description?: string }) => ({
                  id: o.value,
                  label: o.label,
                  description: o.description || "",
                })),
              };
              onQuestionReceivedRef.current?.([dq]);
              setPendingQuestionCount(data.queueLength ?? 0);
              break;
            }

            case "questions-queued": {
              const dqs: DiscussionQuestion[] = (data.questions || []).map(
                (sq: { id: string; question: string; options?: Array<{ value: string; label: string; description?: string }> }) => ({
                  id: sq.id,
                  header: "Question",
                  question: sq.question,
                  multiSelect: false,
                  options: (sq.options || []).map((o) => ({
                    id: o.value,
                    label: o.label,
                    description: o.description || "",
                  })),
                })
              );
              onQuestionReceivedRef.current?.(dqs);
              setPendingQuestionCount(data.count ?? 0);
              break;
            }

            case "answer-given":
              setPendingQuestionCount(data.remainingQueue ?? 0);
              break;

            case "lifecycle":
              setLifecycleEvent(data.event);
              break;
          }
        } catch {
          // Ignore unparseable messages
        }
      };

      ws.onerror = () => {
        console.warn("[ws-provider] WebSocket error occurred");
      };
    }

    connect();

    return () => {
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

  return (
    <WSContext.Provider value={{ connected, lastChange, lifecycleEvent, pendingQuestionCount, onQuestionReceivedRef }}>
      {children}
    </WSContext.Provider>
  );
}

/**
 * Hook to access WebSocket connection state, MCP events, and last file change timestamp.
 */
export function useWebSocket(): WSContextValue {
  return useContext(WSContext);
}
