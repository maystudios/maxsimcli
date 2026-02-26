import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Copy, Check, ChevronRight, Github } from "lucide-react";
import { Footer } from "../components/sections/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

interface SidebarItem {
  id: string;
  label: string;
}

// ─── Sidebar structure ────────────────────────────────────────────────────────

const SIDEBAR: SidebarGroup[] = [
  {
    label: "Introduction",
    items: [
      { id: "what-is-maxsim", label: "What is MAXSIM" },
      { id: "installation", label: "Installation" },
      { id: "quick-start", label: "Quick Start" },
    ],
  },
  {
    label: "Core Concepts",
    items: [
      { id: "context-rot", label: "Context Rot" },
      { id: "planning-directory", label: "Planning Directory" },
      { id: "phases", label: "Phases" },
      { id: "project-state", label: "Project State" },
    ],
  },
  {
    label: "Workflow",
    items: [
      { id: "new-project", label: "New Project" },
      { id: "discuss-phase", label: "Discuss Phase" },
      { id: "plan-phase", label: "Plan Phase" },
      { id: "execute-phase", label: "Execute Phase" },
      { id: "verify-work", label: "Verify Work" },
      { id: "milestones", label: "Milestones" },
    ],
  },
  {
    label: "Dashboard",
    items: [
      { id: "dashboard-overview", label: "Overview" },
      { id: "dashboard-features", label: "Features" },
      { id: "dashboard-network", label: "Network Sharing" },
    ],
  },
  {
    label: "Commands Reference",
    items: [
      { id: "commands-core", label: "Core Commands" },
      { id: "commands-phases", label: "Phase Commands" },
      { id: "commands-milestone", label: "Milestone Commands" },
      { id: "commands-todos", label: "Todo Commands" },
      { id: "commands-utils", label: "Utility Commands" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { id: "config-reference", label: "config.json Reference" },
      { id: "model-profiles", label: "Model Profiles" },
      { id: "workflow-toggles", label: "Workflow Toggles" },
      { id: "branching-strategies", label: "Branching Strategies" },
    ],
  },
  {
    label: "Agents",
    items: [
      { id: "agents-overview", label: "How Agents Work" },
      { id: "agents-reference", label: "Agent Reference" },
    ],
  },
  {
    label: "Advanced",
    items: [
      { id: "quick-tasks", label: "Quick Tasks" },
      { id: "debug-sessions", label: "Debug Sessions" },
      { id: "gap-closure", label: "Gap Closure" },
      { id: "codebase-mapping", label: "Codebase Mapping" },
      { id: "hook-system", label: "Hook System" },
      { id: "model-overrides", label: "Model Overrides" },
    ],
  },
];

// ─── Shared UI Components ─────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-light transition-colors"
      aria-label="Copy code"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
          >
            <Check size={13} className="text-accent" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
          >
            <Copy size={13} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-surface-light px-4 py-2 rounded-t border border-border border-b-0">
        <span className="text-xs text-muted font-mono uppercase tracking-wider">{language}</span>
        <CopyButton text={code.trim()} />
      </div>
      <pre className="bg-surface rounded-b border border-border overflow-x-auto p-4 text-sm font-mono leading-relaxed">
        <code className="text-zinc-300 whitespace-pre">{code.trim()}</code>
      </pre>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      data-section={id}
      className="text-2xl font-bold text-foreground tracking-tight border-l-2 border-accent pl-4 mb-6"
    >
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-foreground mt-8 mb-3">{children}</h3>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-muted text-sm leading-relaxed mb-4">{children}</p>;
}

function Callout({ children, type = "note" }: { children: React.ReactNode; type?: "note" | "tip" | "warn" }) {
  const colors = {
    note: "border-accent bg-accent/5",
    tip: "border-emerald-500 bg-emerald-500/5",
    warn: "border-amber-500 bg-amber-500/5",
  };
  const labels = { note: "Note", tip: "Tip", warn: "Warning" };
  const labelColors = { note: "text-accent", tip: "text-emerald-400", warn: "text-amber-400" };
  return (
    <div className={`border-l-2 ${colors[type]} p-4 rounded-r my-4`}>
      <p className={`text-xs font-mono font-bold uppercase tracking-widest mb-1 ${labelColors[type]}`}>
        {labels[type]}
      </p>
      <p className="text-muted text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border border-border rounded overflow-hidden">
        <thead>
          <tr className="bg-surface border-b border-border">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-surface/60 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 ${j === 0 ? "font-mono text-accent text-xs" : "text-muted"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-16 pb-10 border-b border-border last:border-0">
      {children}
    </div>
  );
}

// ─── Documentation Sections ───────────────────────────────────────────────────

function WhatIsMaxsim() {
  return (
    <Section>
      <SectionHeading id="what-is-maxsim">What is MAXSIM</SectionHeading>
      <Prose>
        MAXSIM is a meta-prompting, context engineering, and spec-driven development system for AI
        coding agents. It works with Claude Code, OpenCode, Gemini CLI, and Codex — and it solves
        one of the most frustrating problems in AI-assisted development: context rot.
      </Prose>
      <Prose>
        When you work with an AI coding agent for hours, the context window fills up with
        conversation history, intermediate thoughts, and dead ends. The model starts forgetting
        earlier decisions, making contradictory choices, and losing track of what the project
        actually needs. This is context rot — and it gets worse the more ambitious your project is.
      </Prose>
      <Prose>
        MAXSIM solves this by offloading each discrete unit of work to a fresh-context subagent.
        Instead of one long conversation that degrades over time, you get a series of focused agents:
        a researcher that knows nothing except the phase it needs to study, an executor that sees
        only the plan it needs to implement, a verifier that checks only whether the deliverables
        match the promise. Each agent starts clean, works with full attention, and hands off
        a structured artifact to the next.
      </Prose>
      <Prose>
        MAXSIM ships as an npm package and installs markdown files — commands, workflows, and
        agent definitions — into your AI runtime's config directory. The "runtime" for MAXSIM
        is the AI itself. You use it through slash commands like{" "}
        <code className="text-accent font-mono text-xs">/maxsim:execute-phase</code>, not
        through a CLI binary you keep running.
      </Prose>
    </Section>
  );
}

function Installation() {
  return (
    <Section>
      <SectionHeading id="installation">Installation</SectionHeading>
      <Prose>
        MAXSIM requires Node.js 22 or later. It installs markdown files into your AI runtime's
        config directories — no long-running process, no global binary, no daemon.
      </Prose>
      <SubHeading>Run the installer</SubHeading>
      <CodeBlock language="bash" code="npx maxsimcli@latest" />
      <Prose>
        The interactive installer asks which AI runtimes you use (Claude Code, OpenCode, Gemini CLI,
        Codex) and copies the appropriate files. You can skip the prompts with flags:
      </Prose>
      <CodeBlock
        language="bash"
        code={`npx maxsimcli@latest --claude     # Claude Code only
npx maxsimcli@latest --opencode   # OpenCode only
npx maxsimcli@latest --all        # All runtimes, no prompts`}
      />
      <SubHeading>What gets installed</SubHeading>
      <Prose>
        For Claude Code, MAXSIM installs into <code className="text-accent font-mono text-xs">~/.claude/</code>:
      </Prose>
      <CodeBlock
        language="text"
        code={`~/.claude/
├── commands/maxsim/   # 30+ user-facing commands (/maxsim:*)
├── agents/            # 11 specialized subagent prompts
├── hooks/             # Pre/post session hooks
└── dashboard/         # Bundled web dashboard (Vite + Express)`}
      />
      <Callout type="note">
        MAXSIM does not modify your project files during install. The .planning/ directory is
        created per-project when you run /maxsim:new-project inside a project.
      </Callout>
    </Section>
  );
}

function QuickStart() {
  return (
    <Section>
      <SectionHeading id="quick-start">Quick Start</SectionHeading>
      <Prose>
        The core MAXSIM workflow follows six steps. Each step is a slash command that spawns
        one or more focused subagents with fresh context.
      </Prose>
      <CodeBlock
        language="bash"
        code={`# 1. Initialize project — creates .planning/ with vision, requirements, roadmap
/maxsim:new-project

# 2. (Optional) Discuss a phase before planning it — surfaces assumptions
/maxsim:discuss-phase 1

# 3. Research + plan + verify — spawns researcher, planner, plan-checker agents
/maxsim:plan-phase 1

# 4. Execute — implements plans with atomic commits and deviation tracking
/maxsim:execute-phase 1

# 5. Verify — UAT-style validation, broken items become decimal fix phases
/maxsim:verify-work 1

# 6. Watch live progress in the dashboard
npx maxsimcli dashboard`}
      />
      <Prose>
        After execution, each plan has a SUMMARY.md committed to git. STATE.md tracks decisions,
        blockers, and metrics across the entire project lifetime. You can always run{" "}
        <code className="text-accent font-mono text-xs">/maxsim:progress</code> to see where you
        are and what to do next.
      </Prose>
      <Callout type="tip">
        Run /maxsim:discuss-phase before /maxsim:plan-phase. The discussion command surfaces
        assumptions and gray areas through adaptive questioning — saving you from discovering them
        mid-execution when they're more expensive to fix.
      </Callout>
    </Section>
  );
}

function ContextRot() {
  return (
    <Section>
      <SectionHeading id="context-rot">Context Rot</SectionHeading>
      <Prose>
        Context rot is the degradation of AI output quality that happens as a conversation grows
        long. Every message you send to an AI agent adds to the context window. Debugging sessions
        add stack traces. Planning sessions add half-formed ideas and rejected alternatives.
        Execution sessions add file contents, test output, and error messages.
      </Prose>
      <Prose>
        By the time you're 20,000 tokens into a session, the model is paying attention to recent
        tokens far more than early ones. It may forget that you rejected a particular approach in
        hour one and suggest it again in hour three. It may lose track of the agreed-upon
        architecture and start making local decisions that contradict the global design.
      </Prose>
      <Prose>
        MAXSIM's solution is structural: never ask one agent to hold the entire project in mind.
        Instead, each subagent receives only the context it needs to do its specific job. The
        executor sees the plan. The verifier sees the plan and the deliverables. The researcher
        sees the phase description and the codebase. Nothing more.
      </Prose>
      <Prose>
        Structured artifacts — PLAN.md, SUMMARY.md, RESEARCH.md, STATE.md — serve as the
        hand-off medium between agents. Because artifacts are written files, they don't decay.
        An agent spawned six months later reads the same STATE.md as the one spawned yesterday.
      </Prose>
      <Callout type="note">
        MAXSIM doesn't prevent you from having long conversations — it makes long conversations
        unnecessary for implementation work. Research, planning, execution, and verification each
        happen in a clean, scoped context.
      </Callout>
    </Section>
  );
}

function PlanningDirectory() {
  return (
    <Section>
      <SectionHeading id="planning-directory">Planning Directory</SectionHeading>
      <Prose>
        Every MAXSIM project has a <code className="text-accent font-mono text-xs">.planning/</code>{" "}
        directory at the project root. This directory is the persistent memory of your project —
        it stores everything from the initial vision through per-task execution summaries.
      </Prose>
      <CodeBlock
        language="text"
        code={`.planning/
├── config.json              # model_profile, workflow flags, branching strategy
├── PROJECT.md               # Vision document (always loaded by agents)
├── REQUIREMENTS.md          # v1/v2/out-of-scope requirements with traceability
├── ROADMAP.md               # Phase structure with milestone groupings
├── STATE.md                 # Live memory: decisions, blockers, metrics, progress
├── phases/
│   └── 01-Foundation/
│       ├── 01-CONTEXT.md        # Decisions made in discuss-phase
│       ├── 01-RESEARCH.md       # Phase research findings
│       ├── 01-01-PLAN.md        # First plan (numbered per attempt)
│       ├── 01-01-SUMMARY.md     # Completion record with deviations
│       ├── 01-VERIFICATION.md   # Post-execution verification results
│       └── 01-UAT.md            # User acceptance test transcript
└── todos/
    ├── pending/                 # Active todo items
    └── completed/               # Archived todos`}
      />
      <Prose>
        The <code className="text-accent font-mono text-xs">config.json</code> file controls model
        selection, workflow agent toggles, and branching strategy. PROJECT.md is loaded into every
        agent context automatically — it's the one document that every agent reads.
      </Prose>
      <Prose>
        Phase directories are named <code className="text-accent font-mono text-xs">NN-Name</code>{" "}
        (e.g., <code className="text-accent font-mono text-xs">01-Foundation</code>). Files within
        them use the phase number as prefix. This naming scheme makes the directory scannable and
        supports the decimal gap-closure phases (01.1, 01.2) that verification creates.
      </Prose>
      <Callout type="tip">
        Commit your .planning/ directory to git. It is the institutional memory of your project —
        SUMMARY.md files, decisions in STATE.md, and RESEARCH.md files are all valuable artifacts
        that should be versioned alongside your code.
      </Callout>
    </Section>
  );
}

function Phases() {
  return (
    <Section>
      <SectionHeading id="phases">Phases</SectionHeading>
      <Prose>
        A phase is a cohesive unit of work that advances the project toward a milestone. Phases
        are defined in ROADMAP.md and tracked in STATE.md. Each phase contains one or more plans
        — a plan is a specific task breakdown for one workstream within the phase.
      </Prose>
      <Prose>
        Phases have a lifecycle: planned, researched, executing, complete. The lifecycle is tracked
        in ROADMAP.md with status symbols. You can query current status any time with{" "}
        <code className="text-accent font-mono text-xs">/maxsim:progress</code>.
      </Prose>
      <SubHeading>Phase numbering</SubHeading>
      <Prose>
        Phases support decimal and letter suffixes to accommodate gap closure and parallel tracks:
      </Prose>
      <DocTable
        headers={["Number", "Meaning"]}
        rows={[
          ["01", "First phase"],
          ["01A", "Parallel track A alongside phase 01"],
          ["01B", "Parallel track B alongside phase 01"],
          ["01.1", "Gap closure sub-phase after phase 01 verification"],
          ["01.2", "Second gap closure sub-phase"],
          ["02", "Second major phase"],
        ]}
      />
      <Prose>
        Sort order is: 01 &lt; 01A &lt; 01B &lt; 01.1 &lt; 01.2 &lt; 02. The{" "}
        <code className="text-accent font-mono text-xs">normalizePhaseName()</code> function in the
        MAXSIM CLI handles this ordering for dashboard display and state tracking.
      </Prose>
      <SubHeading>Phase lifecycle</SubHeading>
      <CodeBlock
        language="text"
        code={`planned     → Phase exists in ROADMAP.md, not yet researched
researched  → plan-phase has run, RESEARCH.md and PLAN.md exist
executing   → execute-phase is in progress
complete    → All plans have SUMMARY.md, verification passed`}
      />
    </Section>
  );
}

function ProjectState() {
  return (
    <Section>
      <SectionHeading id="project-state">Project State</SectionHeading>
      <Prose>
        STATE.md is MAXSIM's cross-session memory. Every executor agent writes to it after
        completing tasks. Every orchestrator reads it before starting a new session. It answers
        the question: "where are we and why did we make the decisions we made?"
      </Prose>
      <Prose>
        STATE.md tracks four categories of information: decisions (architectural choices and the
        reasoning behind them), blockers (unresolved issues that need human input), performance
        metrics (task counts, duration, file counts per plan), and session bookmarks (which plan
        was last active, what the next action is).
      </Prose>
      <CodeBlock
        language="markdown"
        code={`# Project State

## Current Position
- Phase: 02 — API Layer
- Plan: 02-01
- Status: executing
- Stopped at: Completed JWT middleware, next: refresh endpoint

## Decisions
- 2026-02-15: Chose jose over jsonwebtoken — better ESM support
- 2026-02-14: PostgreSQL over SQLite — need concurrent writes

## Blockers
- [ ] Stripe webhook secret not yet provisioned by devops

## Performance Metrics
| Phase | Plan | Tasks | Files | Duration |
|-------|------|-------|-------|----------|
| 01    | 01   | 8     | 23    | 45m      |`}
      />
      <Prose>
        You can edit STATE.md directly in the dashboard's inline editor, or let MAXSIM's CLI
        tools manage it. The <code className="text-accent font-mono text-xs">/maxsim:resume-work</code>{" "}
        command reads STATE.md to restore full context in a new session.
      </Prose>
    </Section>
  );
}

function NewProject() {
  return (
    <Section>
      <SectionHeading id="new-project">New Project</SectionHeading>
      <Prose>
        <code className="text-accent font-mono text-xs">/maxsim:new-project</code> initializes
        a MAXSIM project in your current directory. It runs an interactive session that asks about
        your project vision, constraints, non-goals, and target users — then spawns a project
        researcher and roadmapper to create structured artifacts.
      </Prose>
      <CodeBlock language="bash" code="/maxsim:new-project" />
      <Prose>
        The command creates the entire <code className="text-accent font-mono text-xs">.planning/</code>{" "}
        directory structure. PROJECT.md captures your vision. REQUIREMENTS.md separates v1 must-haves
        from v2 nice-to-haves and explicit out-of-scope items. ROADMAP.md breaks the project into
        phases grouped by milestone.
      </Prose>
      <Prose>
        The project researcher agent uses web search (if Brave Search is configured) to analyze
        the technology ecosystem — frameworks, libraries, known pitfalls — before the roadmapper
        creates the phase breakdown. This prevents phases that are sized wrong or ordered incorrectly.
      </Prose>
      <Callout type="tip">
        Be specific when the researcher asks questions. Vague answers produce vague phases.
        If you already have a stack decision, say so. If you have deadline constraints, mention them.
        The more context you give during new-project, the better every subsequent plan will be.
      </Callout>
    </Section>
  );
}

function DiscussPhase() {
  return (
    <Section>
      <SectionHeading id="discuss-phase">Discuss Phase</SectionHeading>
      <Prose>
        <code className="text-accent font-mono text-xs">/maxsim:discuss-phase</code> is an optional
        but highly recommended step before planning. It runs an adaptive questioning session that
        surfaces assumptions, gray areas, and implicit requirements before a single plan is written.
      </Prose>
      <CodeBlock language="bash" code="/maxsim:discuss-phase 1" />
      <Prose>
        The discussion agent reads your ROADMAP.md, PROJECT.md, and REQUIREMENTS.md, then asks
        targeted questions about the phase. Questions adapt based on your answers — if you mention
        a third-party API, it asks about rate limits and authentication. If you mention real-time
        features, it asks about WebSocket vs. polling tradeoffs.
      </Prose>
      <Prose>
        At the end of the session, the agent writes a{" "}
        <code className="text-accent font-mono text-xs">CONTEXT.md</code> file for the phase.
        The planner reads CONTEXT.md as primary input when creating the plan — so the time you
        spend in discussion directly improves plan quality.
      </Prose>
      <Callout type="note">
        discuss-phase is especially valuable for phases that touch infrastructure, external services,
        or cross-phase integration points. The questions it asks are the same ones an experienced
        architect would ask in a pre-sprint meeting.
      </Callout>
    </Section>
  );
}

function PlanPhase() {
  return (
    <Section>
      <SectionHeading id="plan-phase">Plan Phase</SectionHeading>
      <Prose>
        <code className="text-accent font-mono text-xs">/maxsim:plan-phase</code> is where research
        becomes executable plans. It spawns up to three sequential agents: a phase researcher that
        studies the codebase and domain, a planner that creates task breakdowns, and a plan-checker
        that verifies the plan will actually achieve the phase goal.
      </Prose>
      <CodeBlock
        language="bash"
        code={`/maxsim:plan-phase 1

# Skip research (already done or small phase)
/maxsim:plan-phase 1 --skip-research

# Skip verification (speed over thoroughness)
/maxsim:plan-phase 1 --skip-verify

# Fully autonomous — no pauses for decisions
/maxsim:plan-phase 1 --auto`}
      />
      <Prose>
        Each PLAN.md is a structured document with frontmatter (phase, plan number, type, wave,
        dependencies), an objective, task breakdown with type annotations (auto vs checkpoint),
        verification criteria, and success conditions. The plan-checker reads this document and
        validates that it's complete, unambiguous, and correctly scoped.
      </Prose>
      <Prose>
        Plans support wave-based parallelization via the <code className="text-accent font-mono text-xs">wave</code>{" "}
        frontmatter field. Plans in wave 1 run in parallel, then wave 2 runs after all wave 1 plans
        complete, and so on. The planner infers wave assignments from task dependencies.
      </Prose>
      <SubHeading>Plan types</SubHeading>
      <DocTable
        headers={["Type", "Meaning"]}
        rows={[
          ["auto", "Fully autonomous — executor runs without pausing"],
          ["checkpoint:human-verify", "Pauses for you to visually verify the result in a browser"],
          ["checkpoint:decision", "Pauses when an architectural choice needs human input"],
          ["checkpoint:human-action", "Pauses when a manual step is unavoidable (auth code, email link)"],
        ]}
      />
    </Section>
  );
}

function ExecutePhase() {
  return (
    <Section>
      <SectionHeading id="execute-phase">Execute Phase</SectionHeading>
      <Prose>
        <code className="text-accent font-mono text-xs">/maxsim:execute-phase</code> is the core
        execution engine. It reads all PLAN.md files for a phase, groups them by wave, and runs
        each wave's plans in parallel using Claude's subagent system.
      </Prose>
      <CodeBlock
        language="bash"
        code={`/maxsim:execute-phase 1

# Only execute plans without SUMMARY.md (fill gaps, retry failed)
/maxsim:execute-phase 1 --gaps-only`}
      />
      <Prose>
        Each executor agent works atomically: it commits after every completed task, writes a
        SUMMARY.md when all tasks are done, and updates STATE.md with decisions and metrics.
        If execution is interrupted, the next run with{" "}
        <code className="text-accent font-mono text-xs">--gaps-only</code> picks up exactly where
        things stopped — it skips any plan that already has a SUMMARY.md.
      </Prose>
      <Prose>
        Deviation handling is built into the executor. When it encounters bugs, missing error
        handling, or blocking issues, it auto-fixes them (Rules 1-3) without asking for permission.
        When it encounters architectural decisions or new tables, it pauses and returns a structured
        checkpoint for you to review (Rule 4). All deviations are documented in SUMMARY.md.
      </Prose>
      <SubHeading>Deviation rules</SubHeading>
      <DocTable
        headers={["Rule", "Trigger", "Action"]}
        rows={[
          ["Rule 1", "Code doesn't work as intended", "Auto-fix inline, track in SUMMARY"],
          ["Rule 2", "Missing critical functionality (auth, validation)", "Auto-add, track in SUMMARY"],
          ["Rule 3", "Something blocks task completion", "Auto-fix blocker, track in SUMMARY"],
          ["Rule 4", "Architectural change required", "STOP — return checkpoint for human decision"],
        ]}
      />
      <Callout type="note">
        Wave parallelization requires Claude's extended thinking or subagent features. If your
        runtime doesn't support parallel subagents, plans execute sequentially in wave order.
      </Callout>
    </Section>
  );
}

function VerifyWork() {
  return (
    <Section>
      <SectionHeading id="verify-work">Verify Work</SectionHeading>
      <Prose>
        <code className="text-accent font-mono text-xs">/maxsim:verify-work</code> validates that
        a completed phase actually delivers what it promised. The verifier agent reads ROADMAP.md,
        all SUMMARY.md files for the phase, and systematically checks each deliverable against
        the original plan's success criteria.
      </Prose>
      <CodeBlock language="bash" code="/maxsim:verify-work 1" />
      <Prose>
        Verification runs in two passes. First, the integration checker validates that cross-phase
        connections are intact — APIs that phase 2 depends on were correctly built in phase 1.
        Second, the verifier runs a UAT-style session where it exercises actual functionality and
        records pass/fail against specific acceptance criteria.
      </Prose>
      <Prose>
        For every broken item found, verify-work creates a decimal fix phase. If phase 1 has two
        broken items, you'll get phases 1.1 and 1.2 — each with its own focused PLAN.md. Run{" "}
        <code className="text-accent font-mono text-xs">/maxsim:execute-phase 1.1</code> to close
        the gap, then re-run verify-work to confirm the fix.
      </Prose>
      <Callout type="tip">
        Don't skip verify-work to save time. The UAT session catches integration issues that
        individual executor tests miss — especially cross-phase contract violations and edge cases
        in user flows that weren't explicitly specified.
      </Callout>
    </Section>
  );
}

function Milestones() {
  return (
    <Section>
      <SectionHeading id="milestones">Milestones</SectionHeading>
      <Prose>
        Milestones group phases into shippable deliverables. After completing all phases in a
        milestone, you audit, gap-close, and archive the milestone. MAXSIM provides three commands
        for this workflow.
      </Prose>
      <CodeBlock
        language="bash"
        code={`# Audit milestone — find gaps before archiving
/maxsim:audit-milestone

# Create fix phases for all gaps found in the audit
/maxsim:plan-milestone-gaps

# Archive the milestone and start the next one
/maxsim:complete-milestone

# Create a new milestone in ROADMAP.md
/maxsim:new-milestone`}
      />
      <Prose>
        The audit command reads all phase SUMMARY.md files and original REQUIREMENTS.md entries
        for the milestone, then identifies unmet requirements, partially implemented features,
        and missing deliverables. The result is a structured audit report.
      </Prose>
      <Prose>
        <code className="text-accent font-mono text-xs">/maxsim:plan-milestone-gaps</code> reads
        the audit report and creates one new phase per gap — with full PLAN.md files ready to
        execute. This converts the qualitative audit into an actionable backlog.
      </Prose>
    </Section>
  );
}

function DashboardOverview() {
  return (
    <Section>
      <SectionHeading id="dashboard-overview">Dashboard Overview</SectionHeading>
      <Prose>
        MAXSIM ships a real-time web dashboard bundled inside the CLI — no separate install, no
        Docker, no configuration. It's a Vite+React frontend backed by an Express server that
        watches your <code className="text-accent font-mono text-xs">.planning/</code> directory
        with chokidar and pushes updates over WebSocket the moment any file changes.
      </Prose>
      <CodeBlock language="bash" code="npx maxsimcli dashboard" />
      <Prose>
        The dashboard auto-detects an available port in the range 3333–3343. If the default port
        is in use, it tries the next one. Once started, it opens your browser automatically and
        displays the current project state.
      </Prose>
      <Prose>
        The dashboard is also launched automatically during{" "}
        <code className="text-accent font-mono text-xs">/maxsim:execute-phase</code> so you always
        have a live view of what the executor is doing. You can open it on a second monitor and
        watch plans complete in real time.
      </Prose>
      <CodeBlock
        language="bash"
        code={`# Start dashboard
npx maxsimcli dashboard

# Stop dashboard
npx maxsimcli dashboard --stop`}
      />
    </Section>
  );
}

function DashboardFeatures() {
  return (
    <Section>
      <SectionHeading id="dashboard-features">Dashboard Features</SectionHeading>
      <Prose>
        The dashboard provides a structured view of your project's .planning/ directory with
        interactive editing capabilities. Every panel is connected to the filesystem — changes
        you make in the dashboard are written immediately to the corresponding markdown file.
      </Prose>
      <DocTable
        headers={["Panel", "Description"]}
        rows={[
          ["Phase overview", "Progress bars per phase, milestone stats, completion percentages"],
          ["Phase drill-down", "Expand any phase to see individual plans and task checkboxes"],
          ["Inline editor", "CodeMirror Markdown editor for any .planning/ file — Ctrl+S to save"],
          ["Todos panel", "Create, complete, and delete todos from .planning/todos/"],
          ["Blockers panel", "View and resolve blockers from STATE.md"],
          ["STATE.md editor", "Edit project state, decisions, and session bookmarks inline"],
        ]}
      />
      <Prose>
        The inline CodeMirror editor supports Markdown syntax highlighting and renders a preview
        alongside the raw text. Task checkboxes in the drill-down view are bidirectional — checking
        one in the UI writes the change to the PLAN.md on disk.
      </Prose>
      <Callout type="tip">
        Use the STATE.md editor to manually add decisions after ad-hoc conversations with the AI.
        If you discussed something important outside of MAXSIM's structured workflow, recording it
        in STATE.md ensures future agents have that context.
      </Callout>
    </Section>
  );
}

function DashboardNetwork() {
  return (
    <Section>
      <SectionHeading id="dashboard-network">Network Sharing</SectionHeading>
      <Prose>
        Add <code className="text-accent font-mono text-xs">--network</code> to share the dashboard
        over your local network or Tailscale VPN. This lets teammates view your project progress
        from their own machines, or lets you check progress from your phone.
      </Prose>
      <CodeBlock language="bash" code="npx maxsimcli dashboard --network" />
      <Prose>
        MAXSIM detects your LAN IP and Tailscale IP automatically. It prints both URLs with QR
        codes in the terminal — scan the QR code from your phone to open the dashboard instantly.
      </Prose>
      <SubHeading>Firewall automation</SubHeading>
      <Prose>
        Opening a port for LAN access requires a firewall rule on most systems. MAXSIM creates the
        rule automatically:
      </Prose>
      <DocTable
        headers={["Platform", "Method", "Notes"]}
        rows={[
          ["Windows", "netsh advfirewall", "Prompts UAC elevation — accept to allow rule creation"],
          ["Linux (ufw)", "ufw allow [port]", "Requires sudo — MAXSIM will prompt for password"],
          ["Linux (iptables)", "iptables -A INPUT", "Fallback if ufw not available"],
          ["macOS", "No action needed", "macOS allows inbound on LAN by default"],
        ]}
      />
      <Callout type="note">
        Firewall rules created by MAXSIM are scoped to the dashboard port only. They are not
        removed when you stop the server — you can remove them manually or leave them in place.
      </Callout>
    </Section>
  );
}

function CommandsCore() {
  return (
    <Section>
      <SectionHeading id="commands-core">Core Commands</SectionHeading>
      <DocTable
        headers={["Command", "Description", "Flags"]}
        rows={[
          ["/maxsim:new-project", "Initialize project — creates .planning/ with vision, requirements, roadmap", "—"],
          ["/maxsim:discuss-phase N", "Adaptive questioning before planning — writes CONTEXT.md", "—"],
          ["/maxsim:plan-phase N", "Research, plan, verify phase N", "--auto, --skip-research, --skip-verify"],
          ["/maxsim:execute-phase N", "Execute all plans in phase N with wave parallelization", "--gaps-only"],
          ["/maxsim:verify-work N", "UAT verification — broken items become decimal fix phases", "—"],
          ["/maxsim:quick", "Ad-hoc task with atomic commits, no workflow agents", "--full"],
          ["/maxsim:debug", "Systematic debugging with persistent state across sessions", "—"],
          ["/maxsim:progress", "Show project state and route to next action", "—"],
          ["/maxsim:resume-work", "Restore full context from STATE.md and phase files", "—"],
          ["/maxsim:pause-work", "Record current state and next action to STATE.md", "—"],
          ["/maxsim:roadmap", "Display ROADMAP.md with phase status icons and milestone summary", "—"],
          ["/maxsim:map-codebase", "Analyze codebase with parallel mapper agents", "—"],
        ]}
      />
    </Section>
  );
}

function CommandsPhases() {
  return (
    <Section>
      <SectionHeading id="commands-phases">Phase Commands</SectionHeading>
      <DocTable
        headers={["Command", "Description"]}
        rows={[
          ["/maxsim:add-phase", "Append a new phase to ROADMAP.md at the end of a milestone"],
          ["/maxsim:insert-phase", "Insert a new phase between existing phases, renumbering as needed"],
          ["/maxsim:remove-phase", "Remove a phase from ROADMAP.md"],
          ["/maxsim:list-phase-assumptions", "List all open assumptions from a phase's CONTEXT.md"],
          ["/maxsim:research-phase", "Run the phase researcher agent independently, without planning"],
        ]}
      />
      <CodeBlock
        language="bash"
        code={`# Add a new phase after phase 3
/maxsim:add-phase

# Insert a phase between 01 and 02 (becomes 01A or 01.1 depending on type)
/maxsim:insert-phase

# Run research for phase 2 without proceeding to planning
/maxsim:research-phase 2`}
      />
    </Section>
  );
}

function CommandsMilestone() {
  return (
    <Section>
      <SectionHeading id="commands-milestone">Milestone Commands</SectionHeading>
      <DocTable
        headers={["Command", "Description"]}
        rows={[
          ["/maxsim:complete-milestone", "Archive milestone phases and advance to the next milestone"],
          ["/maxsim:new-milestone", "Add a new milestone to ROADMAP.md with placeholder phases"],
          ["/maxsim:audit-milestone", "Audit milestone against original requirements — find gaps"],
          ["/maxsim:plan-milestone-gaps", "Create fix phases for all gaps found by audit-milestone"],
          ["/maxsim:add-tests", "Generate missing test coverage for a phase's deliverables"],
          ["/maxsim:cleanup", "Remove orphaned files and fix corrupted frontmatter in .planning/"],
        ]}
      />
    </Section>
  );
}

function CommandsTodos() {
  return (
    <Section>
      <SectionHeading id="commands-todos">Todo Commands</SectionHeading>
      <DocTable
        headers={["Command", "Description"]}
        rows={[
          ["/maxsim:add-todo", "Capture an idea or task from the current conversation as a todo file"],
          ["/maxsim:check-todos", "List pending todos and interactively select one to work on next"],
        ]}
      />
      <Prose>
        Todos are stored as markdown files in{" "}
        <code className="text-accent font-mono text-xs">.planning/todos/pending/</code>. Each todo
        has a title, description, priority, and creation timestamp. Completed todos move to{" "}
        <code className="text-accent font-mono text-xs">.planning/todos/completed/</code>.
      </Prose>
      <CodeBlock
        language="bash"
        code={`# Save an idea as a todo (from conversation context)
/maxsim:add-todo

# Review and pick a todo to work on
/maxsim:check-todos`}
      />
    </Section>
  );
}

function CommandsUtils() {
  return (
    <Section>
      <SectionHeading id="commands-utils">Utility Commands</SectionHeading>
      <DocTable
        headers={["Command", "Description", "Flags"]}
        rows={[
          ["/maxsim:health", "Diagnose .planning/ for missing files, bad frontmatter, orphaned phases", "--repair"],
          ["/maxsim:update", "Update MAXSIM to the latest version", "—"],
          ["/maxsim:settings", "Configure model profile and toggle workflow agents interactively", "—"],
          ["/maxsim:set-profile", "Switch model profile: quality, balanced, budget, tokenburner", "—"],
          ["/maxsim:reapply-patches", "Re-run install patches if templates were updated", "—"],
        ]}
      />
      <CodeBlock
        language="bash"
        code={`# Diagnose and auto-repair the .planning/ directory
/maxsim:health --repair

# Switch to the quality profile for a complex phase
/maxsim:set-profile quality

# Update MAXSIM to latest
/maxsim:update`}
      />
      <Callout type="tip">
        Run /maxsim:health before starting execution on a new machine or after a team merge.
        It catches frontmatter corruption, missing phase files, and broken @-references that
        would otherwise cause cryptic errors during planning or execution.
      </Callout>
    </Section>
  );
}

function ConfigReference() {
  return (
    <Section>
      <SectionHeading id="config-reference">config.json Reference</SectionHeading>
      <Prose>
        Place <code className="text-accent font-mono text-xs">.planning/config.json</code> to
        customize MAXSIM behavior per-project. All keys have sensible defaults — start with an
        empty object and add only what you need to change.
      </Prose>
      <CodeBlock
        language="json"
        code={`{
  "model_profile": "balanced",
  "branching_strategy": "none",
  "commit_docs": true,
  "research": true,
  "plan_checker": true,
  "verifier": true,
  "parallelization": true,
  "brave_search": false,
  "model_overrides": {}
}`}
      />
      <DocTable
        headers={["Key", "Type", "Default", "Description"]}
        rows={[
          ["model_profile", "string", "balanced", "Active model profile for all agents"],
          ["branching_strategy", "string", "none", "Git branching: none, phase, or milestone"],
          ["commit_docs", "boolean", "true", "Include SUMMARY.md and STATE.md in git commits"],
          ["research", "boolean", "true", "Enable phase researcher agent before planning"],
          ["plan_checker", "boolean", "true", "Enable plan-checker agent before execution"],
          ["verifier", "boolean", "true", "Enable verifier agent after execution"],
          ["parallelization", "boolean", "true", "Enable wave-based parallel plan execution"],
          ["brave_search", "boolean", "false", "Enable Brave Search API in research agents"],
          ["model_overrides", "object", "{}", "Per-agent model overrides (see Model Overrides)"],
        ]}
      />
    </Section>
  );
}

function ModelProfiles() {
  return (
    <Section>
      <SectionHeading id="model-profiles">Model Profiles</SectionHeading>
      <Prose>
        Model profiles control which Claude model each of the 11 specialized agents uses.
        Orchestrators always use leaner models to minimize cost on routing and coordination work.
        Planners, executors, and debuggers use the model tier configured by your profile.
      </Prose>
      <DocTable
        headers={["Agent", "quality", "balanced", "budget", "tokenburner"]}
        rows={[
          ["maxsim-planner", "opus", "sonnet", "sonnet", "opus"],
          ["maxsim-roadmapper", "opus", "sonnet", "sonnet", "opus"],
          ["maxsim-executor", "opus", "sonnet", "sonnet", "opus"],
          ["maxsim-phase-researcher", "sonnet", "sonnet", "haiku", "opus"],
          ["maxsim-project-researcher", "sonnet", "sonnet", "haiku", "opus"],
          ["maxsim-research-synthesizer", "sonnet", "haiku", "haiku", "opus"],
          ["maxsim-debugger", "opus", "sonnet", "sonnet", "opus"],
          ["maxsim-codebase-mapper", "sonnet", "haiku", "haiku", "opus"],
          ["maxsim-verifier", "sonnet", "sonnet", "haiku", "opus"],
          ["maxsim-plan-checker", "sonnet", "sonnet", "haiku", "opus"],
          ["maxsim-integration-checker", "sonnet", "sonnet", "haiku", "opus"],
        ]}
      />
      <Prose>
        The <code className="text-accent font-mono text-xs">balanced</code> profile (default) gives
        you Sonnet-quality planning and execution with Haiku for lighter tasks. The{" "}
        <code className="text-accent font-mono text-xs">quality</code> profile uses Opus for the
        heavy-lift agents. The <code className="text-accent font-mono text-xs">budget</code> profile
        uses Sonnet only for planners and executors. The{" "}
        <code className="text-accent font-mono text-xs">tokenburner</code> profile uses Opus for
        every agent — maximum quality, maximum cost.
      </Prose>
      <CodeBlock
        language="bash"
        code={`/maxsim:set-profile quality
/maxsim:set-profile balanced
/maxsim:set-profile budget
/maxsim:set-profile tokenburner`}
      />
    </Section>
  );
}

function WorkflowToggles() {
  return (
    <Section>
      <SectionHeading id="workflow-toggles">Workflow Toggles</SectionHeading>
      <Prose>
        MAXSIM's planning workflow includes optional agents you can disable to trade thoroughness
        for speed. Each toggle is a boolean in config.json that can also be overridden per-command
        with a flag.
      </Prose>
      <DocTable
        headers={["Toggle", "Agent", "Cost when enabled", "When to disable"]}
        rows={[
          ["research", "maxsim-phase-researcher", "1–3 min + tokens", "Small phases, already-researched domains"],
          ["plan_checker", "maxsim-plan-checker", "1–2 min + tokens", "Simple plans, rapid iteration"],
          ["verifier", "maxsim-verifier", "2–5 min + tokens", "Speed runs, trusted executors"],
          ["parallelization", "Concurrent subagents", "Varies by wave count", "Sequential debugging, cost control"],
          ["brave_search", "Web search in researchers", "Per-search API cost", "Offline, cost control"],
        ]}
      />
      <CodeBlock
        language="json"
        code={`{
  "research": false,
  "plan_checker": true,
  "verifier": true,
  "parallelization": false
}`}
      />
      <Callout type="warn">
        Disabling the verifier means broken items won't automatically generate fix phases. You'll
        need to run /maxsim:verify-work manually and check results yourself. Recommended only for
        throwaway or prototype phases.
      </Callout>
    </Section>
  );
}

function BranchingStrategies() {
  return (
    <Section>
      <SectionHeading id="branching-strategies">Branching Strategies</SectionHeading>
      <Prose>
        MAXSIM can manage git branches automatically during execution. Set{" "}
        <code className="text-accent font-mono text-xs">branching_strategy</code> in config.json
        to one of three options.
      </Prose>
      <DocTable
        headers={["Strategy", "Branch created", "Example"]}
        rows={[
          ["none", "All work on current branch (default)", "main"],
          ["phase", "One branch per phase", "maxsim/phase-01-foundation"],
          ["milestone", "One branch per milestone", "maxsim/milestone-1-mvp"],
        ]}
      />
      <CodeBlock
        language="json"
        code={`{
  "branching_strategy": "phase"
}`}
      />
      <Prose>
        With <code className="text-accent font-mono text-xs">phase</code> branching, execute-phase
        creates a branch named <code className="text-accent font-mono text-xs">maxsim/phase-NN-name</code>{" "}
        before execution and leaves it there for you to review and merge. With{" "}
        <code className="text-accent font-mono text-xs">milestone</code> branching, the branch
        spans all phases in the milestone.
      </Prose>
      <Callout type="note">
        Branching strategies require a clean working tree before execution. MAXSIM will warn you
        if there are uncommitted changes that would block branch creation.
      </Callout>
    </Section>
  );
}

function AgentsOverview() {
  return (
    <Section>
      <SectionHeading id="agents-overview">How Agents Work</SectionHeading>
      <Prose>
        MAXSIM's agents are markdown prompt files stored in{" "}
        <code className="text-accent font-mono text-xs">~/.claude/agents/</code> (for Claude Code).
        They are not executable binaries — they are specifications that the AI reads and executes
        as a subagent with a fresh context window.
      </Prose>
      <Prose>
        Each agent has a single responsibility. The executor doesn't research. The researcher
        doesn't plan. The plan-checker doesn't write code. This separation ensures that each agent
        can be given exactly the context it needs without contamination from unrelated work.
      </Prose>
      <Prose>
        Agents call <code className="text-accent font-mono text-xs">cli.cjs</code> — MAXSIM's
        tools router — via the Bash tool. The tools router dispatches to core modules that handle
        state management, phase lifecycle, roadmap parsing, and verification. Large outputs (over
        50KB) are written to a tmpfile and returned as{" "}
        <code className="text-accent font-mono text-xs">@file:/path</code> to prevent buffer
        overflow in the Claude Code Bash tool.
      </Prose>
      <Prose>
        Agents communicate with each other through filesystem artifacts, not direct messages.
        The researcher writes RESEARCH.md. The planner reads RESEARCH.md and writes PLAN.md. The
        executor reads PLAN.md and writes SUMMARY.md. Each hand-off is a structured document
        that persists in git.
      </Prose>
    </Section>
  );
}

function AgentsReference() {
  return (
    <Section>
      <SectionHeading id="agents-reference">Agent Reference</SectionHeading>
      <DocTable
        headers={["Agent", "Slug", "Responsibility"]}
        rows={[
          ["Planner", "maxsim-planner", "Creates executable PLAN.md files with task breakdown, types, and dependencies"],
          ["Roadmapper", "maxsim-roadmapper", "Creates ROADMAP.md with phase groupings and milestone structure"],
          ["Executor", "maxsim-executor", "Implements plans atomically, handles deviations, writes SUMMARY.md"],
          ["Phase Researcher", "maxsim-phase-researcher", "Researches how to implement a phase — writes RESEARCH.md"],
          ["Project Researcher", "maxsim-project-researcher", "Researches domain ecosystem before roadmap creation"],
          ["Research Synthesizer", "maxsim-research-synthesizer", "Synthesizes multiple research outputs into a unified summary"],
          ["Debugger", "maxsim-debugger", "Investigates bugs with scientific method, persistent state across sessions"],
          ["Codebase Mapper", "maxsim-codebase-mapper", "Explores codebase and writes structured analysis to .planning/codebase/"],
          ["Verifier", "maxsim-verifier", "Validates phase deliverables against success criteria — writes VERIFICATION.md"],
          ["Plan Checker", "maxsim-plan-checker", "Verifies PLAN.md completeness and achievability before execution"],
          ["Integration Checker", "maxsim-integration-checker", "Validates cross-phase integration and end-to-end user flows"],
        ]}
      />
      <Prose>
        All agents follow the same basic pattern: read context from .planning/ files, do focused
        work, write a structured artifact, update STATE.md. Agents never talk to each other
        directly — they read each other's output files.
      </Prose>
    </Section>
  );
}

function QuickTasks() {
  return (
    <Section>
      <SectionHeading id="quick-tasks">Quick Tasks</SectionHeading>
      <Prose>
        <code className="text-accent font-mono text-xs">/maxsim:quick</code> is MAXSIM's escape
        hatch for ad-hoc work. It runs a single executor with atomic commits and state tracking,
        but skips the researcher, plan-checker, and verifier agents. Use it for tasks that don't
        warrant a full phase: small bug fixes, one-off scripts, quick UI tweaks.
      </Prose>
      <CodeBlock
        language="bash"
        code={`# Quick task — minimal agents, fast execution
/maxsim:quick

# Full agents — same as execute-phase for a single task
/maxsim:quick --full`}
      />
      <Prose>
        When to use quick vs execute-phase: use quick for tasks you could describe in one sentence
        and that have no dependencies on other planned work. Use execute-phase when the task is
        part of a planned phase, has multiple sub-tasks, or needs the plan-checker's validation.
      </Prose>
      <Callout type="note">
        Even in quick mode, the executor still commits after each task, updates STATE.md, and
        follows the deviation rules. It's "quick" because it skips optional planning agents —
        not because it cuts corners on execution quality.
      </Callout>
    </Section>
  );
}

function DebugSessions() {
  return (
    <Section>
      <SectionHeading id="debug-sessions">Debug Sessions</SectionHeading>
      <Prose>
        <code className="text-accent font-mono text-xs">/maxsim:debug</code> runs the debugger
        agent with persistent state. Unlike a regular conversation, debugging state is written to
        a file after each step — so if the context window fills up, you can start a fresh session
        and continue from exactly where you stopped.
      </Prose>
      <CodeBlock language="bash" code='/maxsim:debug "auth token not refreshing after 401"' />
      <Prose>
        The debugger uses a scientific method approach: it forms a hypothesis, tests it, records
        the result, and forms the next hypothesis based on evidence. Each step is committed to the
        debug state file. If the issue spans multiple sessions, the next session reads the existing
        state and continues the investigation.
      </Prose>
      <Prose>
        Debugging state is stored in{" "}
        <code className="text-accent font-mono text-xs">.planning/debug/</code>. Each debug session
        has a slug derived from the issue description. You can have multiple concurrent debug
        sessions for different issues.
      </Prose>
    </Section>
  );
}

function GapClosure() {
  return (
    <Section>
      <SectionHeading id="gap-closure">Gap Closure</SectionHeading>
      <Prose>
        When verify-work finds broken items, it doesn't just report them — it creates focused fix
        phases automatically. If phase 1 has two broken items, they become phases 1.1 and 1.2.
        Each has its own PLAN.md and is executed independently.
      </Prose>
      <CodeBlock
        language="bash"
        code={`# After verify-work finds broken items:
/maxsim:execute-phase 1.1
/maxsim:execute-phase 1.2

# Or re-run only plans without SUMMARY.md:
/maxsim:execute-phase 1 --gaps-only`}
      />
      <Prose>
        The <code className="text-accent font-mono text-xs">--gaps-only</code> flag makes
        execute-phase skip any plan that already has a SUMMARY.md. This is the fastest way to
        retry after partial execution — you don't need to know which plans failed, MAXSIM
        figures it out from the filesystem.
      </Prose>
      <Prose>
        After closing all gaps, re-run verify-work to confirm. Verification creates a new
        VERIFICATION.md that supersedes the previous one. The phase is marked complete only
        when a verification pass finds no broken items.
      </Prose>
    </Section>
  );
}

function CodebaseMapping() {
  return (
    <Section>
      <SectionHeading id="codebase-mapping">Codebase Mapping</SectionHeading>
      <Prose>
        <code className="text-accent font-mono text-xs">/maxsim:map-codebase</code> analyzes an
        existing codebase using parallel mapper agents. This is useful when onboarding MAXSIM to
        a project that already has code — the mappers produce structured analysis that subsequent
        planning agents use as context.
      </Prose>
      <CodeBlock language="bash" code="/maxsim:map-codebase" />
      <Prose>
        Multiple codebase-mapper agents run in parallel, each covering a different area of the
        codebase. One covers data models, another covers API routes, another covers frontend
        components, another covers infrastructure. Their outputs are synthesized into a unified
        analysis in <code className="text-accent font-mono text-xs">.planning/codebase/</code>.
      </Prose>
      <Prose>
        The codebase analysis is automatically loaded by phase-researcher agents. When planning
        a phase in an existing codebase, the researcher reads the analysis to understand existing
        patterns, conventions, and potential integration points — rather than re-discovering them
        from scratch.
      </Prose>
    </Section>
  );
}

function HookSystem() {
  return (
    <Section>
      <SectionHeading id="hook-system">Hook System</SectionHeading>
      <Prose>
        MAXSIM installs three hooks into your AI runtime's hook system. These run automatically
        without any command — they're background utilities that improve your development experience.
      </Prose>
      <DocTable
        headers={["Hook", "When it runs", "What it does"]}
        rows={[
          ["maxsim-statusline", "Every session", "Shows model · task · directory · context bar in the terminal statusline"],
          ["maxsim-context-monitor", "Continuously during sessions", "Warns at 35% context used, prompts to pause at 25% remaining"],
          ["maxsim-check-update", "Session start", "Checks for new MAXSIM version, notifies once per day"],
        ]}
      />
      <Prose>
        The context monitor is the most important hook. It watches your context window usage and
        warns you before you hit the limit. At 35% context remaining, it suggests starting a new
        session soon. At 25% remaining, it prompts you to run{" "}
        <code className="text-accent font-mono text-xs">/maxsim:pause-work</code> to save state
        before the context fills up completely.
      </Prose>
      <Prose>
        The statusline hook reads from STATE.md to show the current task and phase in your terminal
        prompt. This gives you a quick glance at where MAXSIM thinks you are without opening
        the dashboard.
      </Prose>
    </Section>
  );
}

function ModelOverrides() {
  return (
    <Section>
      <SectionHeading id="model-overrides">Model Overrides</SectionHeading>
      <Prose>
        Per-agent model overrides let you assign a specific model to any agent, regardless of the
        active profile. This is useful when you want Opus quality for planning but are fine with
        Haiku for research and verification.
      </Prose>
      <CodeBlock
        language="json"
        code={`{
  "model_profile": "balanced",
  "model_overrides": {
    "maxsim-planner": "opus",
    "maxsim-executor": "opus",
    "maxsim-phase-researcher": "haiku",
    "maxsim-verifier": "haiku"
  }
}`}
      />
      <Prose>
        Override keys are the agent slugs (same as the filename without the .md extension in the
        agents/ directory). Override values are model tiers: "opus", "sonnet", or "haiku".
        Overrides take precedence over the profile — an overridden agent always uses the specified
        model regardless of what the profile says.
      </Prose>
      <Prose>
        Model overrides are the recommended way to optimize cost for projects where you know which
        agents need the most capability. For example: complex planning benefits from Opus, but
        codebase mapping (which is mostly reading and categorizing) works fine with Haiku.
      </Prose>
      <Callout type="tip">
        Start with the balanced profile and switch individual agents to Opus only when you find
        their output quality insufficient. This gives you quality where it matters without paying
        for Opus on every background task.
      </Callout>
    </Section>
  );
}

// ─── Sidebar Component ────────────────────────────────────────────────────────

function Sidebar({
  activeId,
  onNavigate,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="flex flex-col gap-6">
      {SIDEBAR.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-mono uppercase tracking-widest text-muted/40 mb-2 px-3">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-left text-sm px-3 py-1.5 rounded transition-colors duration-150 cursor-pointer ${
                    active
                      ? "text-foreground bg-accent/10 font-medium"
                      : "text-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {active && (
                      <span className="block w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                    )}
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ─── Docs Navbar ──────────────────────────────────────────────────────────────

function DocsNavbar({ onMobileMenuToggle, mobileOpen }: { onMobileMenuToggle: () => void; mobileOpen: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleHome = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-background/90 backdrop-blur-lg border-border"
          : "bg-background/80 backdrop-blur-md border-border/60"
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a
            href="/"
            onClick={handleHome}
            className="text-base font-bold tracking-tight text-foreground"
          >
            MAXSIM
          </a>
          <ChevronRight size={14} className="text-muted/40" />
          <span className="text-sm text-muted">Docs</span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a
            href="/"
            onClick={handleHome}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Back to Home
          </a>
          <a
            href="https://github.com/maystudios/maxsim"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <Github size={14} />
            GitHub
          </a>
        </div>

        <button
          className="md:hidden text-muted hover:text-foreground"
          onClick={onMobileMenuToggle}
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </motion.header>
  );
}

// ─── Main DocsPage Component ──────────────────────────────────────────────────

export default function DocsPage() {
  const [activeId, setActiveId] = useState("what-is-maxsim");
  const [mobileOpen, setMobileOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const allSectionIds = SIDEBAR.flatMap((g) => g.items.map((i) => i.id));

  // Scrollspy via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visibleMap = new Map<string, number>();

    const flush = () => {
      if (isScrollingRef.current) return;
      let best = "";
      let bestRatio = -1;
      for (const [id, ratio] of visibleMap) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = id;
        }
      }
      if (best) setActiveId(best);
    };

    for (const id of allSectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            visibleMap.set(id, entry.intersectionRatio);
          }
          flush();
        },
        { threshold: [0, 0.1, 0.3, 0.5], rootMargin: "-80px 0px -40% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const navigateTo = useCallback((id: string) => {
    setActiveId(id);
    setMobileOpen(false);
    isScrollingRef.current = true;
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <DocsNavbar
        onMobileMenuToggle={() => setMobileOpen((v) => !v)}
        mobileOpen={mobileOpen}
      />

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-lg pt-14 overflow-y-auto md:hidden"
          >
            <div className="px-6 py-6">
              <Sidebar activeId={activeId} onNavigate={navigateTo} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-screen-xl mx-auto flex pt-14">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto py-8 px-4 border-r border-border">
          <Sidebar activeId={activeId} onNavigate={navigateTo} />
        </aside>

        {/* Content */}
        <main ref={contentRef} className="flex-1 min-w-0 px-6 md:px-12 lg:px-16 py-8 max-w-3xl">
          <WhatIsMaxsim />
          <Installation />
          <QuickStart />
          <ContextRot />
          <PlanningDirectory />
          <Phases />
          <ProjectState />
          <NewProject />
          <DiscussPhase />
          <PlanPhase />
          <ExecutePhase />
          <VerifyWork />
          <Milestones />
          <DashboardOverview />
          <DashboardFeatures />
          <DashboardNetwork />
          <CommandsCore />
          <CommandsPhases />
          <CommandsMilestone />
          <CommandsTodos />
          <CommandsUtils />
          <ConfigReference />
          <ModelProfiles />
          <WorkflowToggles />
          <BranchingStrategies />
          <AgentsOverview />
          <AgentsReference />
          <QuickTasks />
          <DebugSessions />
          <GapClosure />
          <CodebaseMapping />
          <HookSystem />
          <ModelOverrides />
        </main>
      </div>

      <Footer />
    </div>
  );
}
