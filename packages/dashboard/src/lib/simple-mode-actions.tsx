import type { RoadmapAnalysis } from "@maxsim/core";
import type { ReactNode } from "react";

export interface ActionDef {
  id: string;
  tab: "plan" | "execute";
  title: string;
  description: string;
  icon: ReactNode;
  requiresInput: boolean;
  command: string;
  isAvailable: (roadmap: RoadmapAnalysis | null) => boolean;
  unavailableReason: string;
}

function hasPhases(r: RoadmapAnalysis | null) { return (r?.phases?.length ?? 0) > 0; }
function hasActivePhase(r: RoadmapAnalysis | null) {
  return r?.phases?.some(p =>
    p.disk_status === "partial" ||
    p.disk_status === "planned" ||
    p.disk_status === "discussed" ||
    p.disk_status === "researched"
  ) ?? false;
}

export const ACTION_DEFS: ActionDef[] = [
  // ── Plan & Discuss tab ──
  {
    id: "plan-new-phase",
    tab: "plan",
    title: "Plan New Phase",
    description: "Create a detailed execution plan for the next phase",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="4" width="14" height="13" rx="1" />
        <path d="M7 8h6M7 11h4M10 2v4" strokeLinecap="round" />
      </svg>
    ),
    requiresInput: true,
    command: "/maxsim:plan-phase",
    isAvailable: (r) => hasPhases(r),
    unavailableReason: "No phases found in ROADMAP.md — create a project first",
  },
  {
    id: "add-phase",
    tab: "plan",
    title: "Add Phase",
    description: "Insert a new phase into the roadmap",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="4" width="14" height="13" rx="1" />
        <path d="M10 8v6M7 11h6" strokeLinecap="round" />
      </svg>
    ),
    requiresInput: true,
    command: "/maxsim:add-phase",
    isAvailable: (r) => hasPhases(r),
    unavailableReason: "No project loaded — create a project first",
  },
  {
    id: "discuss-phase",
    tab: "plan",
    title: "Discuss Phase",
    description: "Answer planning questions to define requirements for a phase",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 6a1 1 0 011-1h12a1 1 0 011 1v7a1 1 0 01-1 1H7l-4 3V6z" strokeLinejoin="round" />
      </svg>
    ),
    requiresInput: false,
    command: "/maxsim:discuss-phase",
    isAvailable: (r) => hasActivePhase(r),
    unavailableReason: "No active phase to discuss — plan a phase first",
  },
  {
    id: "init-existing",
    tab: "plan",
    title: "Init Existing",
    description: "Set up MAXSIM planning for an existing project",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M10 3v10M10 13l-3-3M10 13l3-3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17h12" strokeLinecap="round" />
      </svg>
    ),
    requiresInput: false,
    command: "/maxsim:init-existing",
    isAvailable: () => true,
    unavailableReason: "",
  },
  {
    id: "new-project",
    tab: "plan",
    title: "New Project",
    description: "Start a brand new MAXSIM project from scratch",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M10 4v12M4 10h12" strokeLinecap="round" />
      </svg>
    ),
    requiresInput: false,
    command: "/maxsim:quick",
    isAvailable: () => true,
    unavailableReason: "",
  },
  // ── Execute & Verify tab ──
  {
    id: "execute-phase",
    tab: "execute",
    title: "Execute Phase",
    description: "Run the current phase plan and implement the changes",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M6 4l10 6-10 6V4z" strokeLinejoin="round" />
      </svg>
    ),
    requiresInput: false,
    command: "/maxsim:execute-phase",
    isAvailable: (r) => hasActivePhase(r),
    unavailableReason: "No phase is currently planned — plan a phase first",
  },
  {
    id: "verify-work",
    tab: "execute",
    title: "Verify Work",
    description: "Check that completed phase work meets all acceptance criteria",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    requiresInput: false,
    command: "/maxsim:verify-work",
    isAvailable: (r) => hasPhases(r),
    unavailableReason: "No phases to verify — complete a phase first",
  },
  {
    id: "audit-milestone",
    tab: "execute",
    title: "Audit Milestone",
    description: "Review and archive a completed milestone",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 5h12M4 10h8M4 15h10" strokeLinecap="round" />
        <circle cx="16" cy="14" r="2.5" />
        <path d="M18 16l1.5 1.5" strokeLinecap="round" />
      </svg>
    ),
    requiresInput: false,
    command: "/maxsim:audit-milestone",
    isAvailable: (r) => hasPhases(r),
    unavailableReason: "No milestone to audit — complete some phases first",
  },
  {
    id: "fix-gaps",
    tab: "execute",
    title: "Fix Gaps",
    description: "Create plans to close verification failures",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M10 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 10a6 6 0 1012 0" strokeLinecap="round" />
      </svg>
    ),
    requiresInput: false,
    command: "/maxsim:plan-phase --gaps",
    isAvailable: (r) => hasPhases(r),
    unavailableReason: "No phases to fix — complete a verification first",
  },
  {
    id: "find-gaps",
    tab: "execute",
    title: "Find Gaps",
    description: "Identify missing requirements or unverified work",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="9" cy="9" r="5" />
        <path d="M16 16l-3-3" strokeLinecap="round" />
        <path d="M9 7v2M9 11h.01" strokeLinecap="round" />
      </svg>
    ),
    requiresInput: false,
    command: "/maxsim:verify-work --find-gaps",
    isAvailable: (r) => hasPhases(r),
    unavailableReason: "No phases to analyze — create some phases first",
  },
  {
    id: "view-roadmap",
    tab: "execute",
    title: "View Roadmap",
    description: "See all phases and their status inline",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 5h14M3 10h14M3 15h8" strokeLinecap="round" />
      </svg>
    ),
    requiresInput: false,
    command: "",
    isAvailable: (r) => hasPhases(r),
    unavailableReason: "No roadmap to display",
  },
];
