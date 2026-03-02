/**
 * Backend Types — Type definitions for the MAXSIM backend server
 */

export interface BackendConfig {
  port: number;
  host: string;
  projectCwd: string;
  enableTerminal: boolean;
  enableFileWatcher: boolean;
  enableMcp: boolean;
  logDir: string;
}

export interface BackendStatus {
  status: 'ok' | 'starting' | 'error';
  ready: boolean;
  port: number;
  cwd: string;
  uptime: number;
  pid: number;
  mcpEndpoint: string | null;
  terminalAvailable: boolean;
  connectedClients: number;
}

export interface BackendLockFile {
  pid: number;
  port: number;
  startedAt: number;
  cwd: string;
}

export type WSMessage =
  | { type: 'connected'; timestamp: number }
  | { type: 'file-changes'; changes: string[]; timestamp: number }
  | { type: 'question-received'; question: PendingQuestion; queueLength: number }
  | { type: 'answer-given'; questionId: string; remainingQueue: number }
  | { type: 'lifecycle'; event: LifecycleEvent }
  | { type: 'questions-queued'; questions: PendingQuestion[]; count: number };

export interface PendingQuestion {
  id: string;
  question: string;
  options: { value: string; label: string; description?: string }[];
  allowFreeText: boolean;
  receivedAt: number;
}

export interface LifecycleEvent {
  type: string;
  phase?: string;
  plan?: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface BackendServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): BackendStatus;
  getPort(): number;
}
