/** Dashboard display mode — persisted in localStorage and server config */
export type DashboardMode = "simple" | "advanced";

/** Phase data as displayed in the dashboard */
export interface DashboardPhase {
  number: string;
  name: string;
  goal: string;
  dependsOn: string[];
  planCount: number;
  summaryCount: number;
  diskStatus: "complete" | "partial" | "planned" | "empty" | "no_directory" | "discussed" | "researched";
  roadmapComplete: boolean;
  hasContext: boolean;
  hasResearch: boolean;
}

/** Top-level stats shown in the dashboard header */
export interface DashboardStats {
  milestoneProgress: number;
  currentPhase: string;
  completedPhases: number;
  totalPhases: number;
  openBlockers: number;
  openTodos: number;
}

/** Current project state from STATE.md */
export interface DashboardState {
  position: string;
  lastActivity: string;
  currentPhase: string;
  currentPlan: string;
  status: string;
}

/** A single task within a plan */
export interface PlanTask {
  name: string;
  type: string;
  files: string[];
  action: string;
  verify: string;
  done: string;
  completed: boolean;
}

/** A parsed plan file */
export interface PlanFile {
  path: string;
  content: string;
  frontmatter: Record<string, unknown>;
  tasks: PlanTask[];
}

/** A todo item from the todos directory */
export interface TodoItem {
  text: string;
  completed: boolean;
  file: string;
}

/** File change event pushed via WebSocket */
export interface FileChangeEvent {
  type: "file-changes";
  changes: string[];
  timestamp: number;
}

/** WebSocket connected event */
export interface WSConnectedEvent {
  type: "connected";
  timestamp: number;
}

/** WebSocket error event */
export interface WSErrorEvent {
  type: "error";
  message: string;
  timestamp: number;
}

/** State data returned by the server */
export interface ParsedState {
  position: string | null;
  lastActivity: string | null;
  currentPhase: string | null;
  currentPlan: string | null;
  status: string | null;
  progress: string | null;
  decisions: string[];
  blockers: string[];
  content: string;
}

/** Discriminated union of all WebSocket message types */
export type WSMessage = FileChangeEvent | WSConnectedEvent | WSErrorEvent;
