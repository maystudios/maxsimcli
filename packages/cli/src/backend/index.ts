export type {
  BackendConfig,
  BackendStatus,
  BackendLockFile,
  WSMessage,
  BackendServer,
  PendingQuestion,
  LifecycleEvent,
} from './types.js';
export { createBackendServer } from './server.js';
export {
  startBackend,
  stopBackend,
  getBackendStatus,
  isBackendRunning,
  findBackendPort,
} from './lifecycle.js';
