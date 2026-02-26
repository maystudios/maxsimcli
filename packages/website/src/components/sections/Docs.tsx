import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, Terminal, Layers, Settings, Users, FolderTree } from "lucide-react";

type TabId = "getting-started" | "commands" | "architecture" | "configuration" | "agents";

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
            <Check size={14} className="text-accent" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
          >
            <Copy size={14} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  return (
    <div className="relative group">
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

function DocHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-foreground font-bold text-xl tracking-tight mb-4">{children}</h3>
  );
}

function DocSubheading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-foreground font-semibold text-base tracking-tight mb-3 mt-6">{children}</h4>
  );
}

function DocText({ children }: { children: React.ReactNode }) {
  return <p className="text-muted text-sm leading-relaxed mb-4">{children}</p>;
}

// ─── Tab: Getting Started ─────────────────────────────────────────────────────

function GettingStarted() {
  return (
    <div className="space-y-8">
      <div>
        <DocHeading>Installation</DocHeading>
        <DocText>
          Requirements: Node.js &gt;= 22. MAXSIM installs markdown files into your
          AI runtime's config directories — no global binary needed.
        </DocText>
      </div>

      <div>
        <DocSubheading>Quick Install (recommended)</DocSubheading>
        <CodeBlock
          language="bash"
          code={`npx maxsimcli@latest`}
        />
      </div>

      <div>
        <DocSubheading>What gets installed</DocSubheading>
        <DocText>
          MAXSIM places commands, workflows, and agent definitions into your AI runtime's
          config directory. For Claude Code that's ~/.claude/.
        </DocText>
        <CodeBlock
          language="text"
          code={`~/.claude/
├── commands/maxsim/   # 31 user-facing commands (/maxsim:*)
├── agents/            # 11 specialized agent prompts
├── hooks/             # Pre/post hooks for automation
└── dashboard/         # Pre-built web dashboard (Vite + Express)`}
        />
      </div>

      <div>
        <DocSubheading>Start a new project</DocSubheading>
        <DocText>
          Initialize a project with deep context gathering. This creates the .planning/
          directory with PROJECT.md, REQUIREMENTS.md, and ROADMAP.md.
        </DocText>
        <CodeBlock
          language="bash"
          code={`# In your project directory, use the slash command:
/maxsim:new-project`}
        />
      </div>
    </div>
  );
}

// ─── Tab: Commands ────────────────────────────────────────────────────────────

interface CommandDef {
  name: string;
  signature: string;
  description: string;
  flags?: string[];
  example: string;
}

const commands: CommandDef[] = [
  {
    name: "new-project",
    signature: "/maxsim:new-project",
    description: "Initialize a new project with deep context gathering. Creates PROJECT.md, REQUIREMENTS.md, and a phased ROADMAP.md.",
    example: `/maxsim:new-project`,
  },
  {
    name: "plan-phase",
    signature: "/maxsim:plan-phase",
    description: "Research, plan, and verify a phase before execution. Spawns researcher, planner, and plan-checker agents.",
    example: `/maxsim:plan-phase`,
  },
  {
    name: "execute-phase",
    signature: "/maxsim:execute-phase",
    description: "Execute all plans in a phase with wave-based parallelization, atomic commits, and state tracking.",
    example: `/maxsim:execute-phase`,
  },
  {
    name: "progress",
    signature: "/maxsim:progress",
    description: "Check project progress, show context, and route to the next action — either execute or plan.",
    example: `/maxsim:progress`,
  },
  {
    name: "debug",
    signature: "/maxsim:debug",
    description: "Systematic debugging with persistent state across context resets. Uses scientific method and checkpoints.",
    example: `/maxsim:debug`,
  },
  {
    name: "verify-work",
    signature: "/maxsim:verify-work",
    description: "Validate built features through conversational user acceptance testing.",
    example: `/maxsim:verify-work`,
  },
  {
    name: "discuss-phase",
    signature: "/maxsim:discuss-phase",
    description: "Gather phase context through adaptive questioning before planning. Helps clarify requirements and assumptions.",
    example: `/maxsim:discuss-phase`,
  },
  {
    name: "resume-work",
    signature: "/maxsim:resume-work",
    description: "Resume work from the previous session with full context restoration from STATE.md and phase files.",
    example: `/maxsim:resume-work`,
  },
  {
    name: "roadmap",
    signature: "/maxsim:roadmap",
    description: "Display the project roadmap with phase status icons, plan counts, and milestone summary.",
    example: `/maxsim:roadmap`,
  },
  {
    name: "dashboard",
    signature: "npx maxsimcli dashboard",
    description: "Launch the real-time web dashboard. View phase progress, todos, blockers, quick commands, and an interactive terminal in your browser.",
    example: `npx maxsimcli dashboard`,
  },
];

function Commands() {
  return (
    <div className="space-y-10">
      {commands.map((cmd) => (
        <div key={cmd.name} className="border-l-2 border-accent pl-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <code className="text-accent font-mono font-semibold text-base">{cmd.signature}</code>
          </div>
          <DocText>{cmd.description}</DocText>

          {cmd.flags && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-muted font-medium mb-2">Flags</p>
              <div className="flex flex-wrap gap-2">
                {cmd.flags.map((f) => (
                  <span
                    key={f}
                    className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-zinc-400"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <CodeBlock language="bash" code={cmd.example} />
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Architecture ────────────────────────────────────────────────────────

function Architecture() {
  return (
    <div className="space-y-8">
      <div>
        <DocHeading>Three-Layer Structure</DocHeading>
        <DocText>
          MAXSIM commands are markdown prompts, not executable code. The "runtime" is the AI itself.
          Commands load workflows which spawn agents.
        </DocText>
        <CodeBlock
          language="text"
          code={`commands/maxsim/*.md       # User-facing command specs (31 files)
maxsim/workflows/*.md      # Implementation workflows
agents/*.md                # Specialized subagent prompts (11 agents)`}
        />
      </div>

      <div>
        <DocSubheading>Data Structure in User Projects</DocSubheading>
        <DocText>
          MAXSIM creates a .planning/ directory in user projects to track all state.
        </DocText>
        <CodeBlock
          language="text"
          code={`.planning/
├── config.json            # model_profile, workflow flags
├── PROJECT.md             # Vision (always loaded)
├── REQUIREMENTS.md        # v1/v2/out-of-scope requirements
├── ROADMAP.md             # Phase structure
├── STATE.md               # Memory: decisions, blockers, metrics
├── phases/
│   └── 01-Foundation/
│       ├── 01-CONTEXT.md        # User decisions
│       ├── 01-RESEARCH.md       # Phase findings
│       ├── 01-01-PLAN.md        # Task plan
│       ├── 01-01-SUMMARY.md     # Completion record
│       ├── 01-VERIFICATION.md   # Verification results
│       └── 01-UAT.md            # User acceptance tests
└── todos/pending/ & todos/completed/`}
        />
      </div>

      <div>
        <DocSubheading>Tools Layer</DocSubheading>
        <DocText>
          cli.cjs is the main tools router — it dispatches to core modules for state management,
          phase lifecycle, roadmap parsing, verification, and more. Large outputs are written to
          a tmpfile and returned as @file:/path to prevent buffer overflow.
        </DocText>
      </div>
    </div>
  );
}

// ─── Tab: Configuration ───────────────────────────────────────────────────────

const configJson = `{
  "model_profile": "balanced",
  "branching_strategy": "phase-branches",
  "auto_commit": true,
  "require_verification": true,
  "parallel_execution": true,
  "max_parallel_agents": 3
}`;

function Configuration() {
  return (
    <div className="space-y-6">
      <div>
        <DocHeading>.planning/config.json</DocHeading>
        <DocText>
          Place config.json in your .planning/ directory to customize MAXSIM behavior.
          All values have sensible defaults.
        </DocText>
      </div>
      <CodeBlock language="json" code={configJson} />

      <div>
        <DocSubheading>Model Profiles</DocSubheading>
        <DocText>
          Three tiers map to Claude models per agent type. Orchestrators use leaner models;
          planners and executors use heavier ones.
        </DocText>
        <CodeBlock
          language="text"
          code={`quality       → Opus for planners/executors, Sonnet for orchestrators
balanced      → Sonnet for planners/executors, Haiku for orchestrators
budget        → Haiku for everything
tokenburner   → Opus for everything (maximum quality, maximum cost)`}
        />
      </div>

      <div>
        <DocSubheading>Change profile</DocSubheading>
        <CodeBlock
          language="bash"
          code={`/maxsim:set-profile quality`}
        />
      </div>
    </div>
  );
}

// ─── Tab: Agents ──────────────────────────────────────────────────────────────

const agents = [
  { name: "Phase Researcher", description: "Researches how to implement a phase before planning" },
  { name: "Planner", description: "Creates executable phase plans with task breakdown and dependencies" },
  { name: "Plan Checker", description: "Verifies plans will achieve the phase goal before execution" },
  { name: "Executor", description: "Implements plans with atomic commits and state management" },
  { name: "Verifier", description: "Checks that codebase delivers what the phase promised" },
  { name: "Debugger", description: "Investigates bugs using scientific method with checkpoints" },
  { name: "Integration Checker", description: "Verifies cross-phase integration and E2E flows" },
  { name: "Project Researcher", description: "Researches domain ecosystem before roadmap creation" },
  { name: "Research Synthesizer", description: "Synthesizes research outputs into summaries" },
  { name: "Roadmapper", description: "Creates project roadmaps with phase breakdown" },
  { name: "Codebase Mapper", description: "Explores codebase and writes structured analysis" },
];

function Agents() {
  return (
    <div className="space-y-6">
      <div>
        <DocHeading>Specialized Agents</DocHeading>
        <DocText>
          MAXSIM spawns specialized subagents — each with fresh context and a single responsibility.
          Agents are defined as markdown prompts in the agents/ directory.
        </DocText>
      </div>

      <div className="hidden md:block overflow-hidden border border-border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium w-48">Agent</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">Responsibility</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, i) => (
              <motion.tr
                key={agent.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="border-b border-border last:border-0 hover:bg-surface transition-colors"
              >
                <td className="px-4 py-3">
                  <code className="font-mono text-accent text-xs">{agent.name}</code>
                </td>
                <td className="px-4 py-3 text-muted">{agent.description}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="border border-border rounded p-4 bg-surface"
          >
            <code className="font-mono text-accent text-sm font-semibold">{agent.name}</code>
            <p className="text-muted text-sm mt-1">{agent.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const tabs: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: "getting-started", label: "Getting Started", Icon: Terminal },
  { id: "commands", label: "Commands", Icon: Terminal },
  { id: "architecture", label: "Architecture", Icon: FolderTree },
  { id: "configuration", label: "Configuration", Icon: Settings },
  { id: "agents", label: "Agents", Icon: Users },
];

function tabContent(id: TabId) {
  switch (id) {
    case "getting-started": return <GettingStarted />;
    case "commands": return <Commands />;
    case "architecture": return <Architecture />;
    case "configuration": return <Configuration />;
    case "agents": return <Agents />;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Docs() {
  const [activeTab, setActiveTab] = useState<TabId>("getting-started");
  const tabRefs = useRef<Map<TabId, HTMLButtonElement>>(new Map());

  return (
    <section id="docs" className="bg-background py-24 px-6">
      <div className="max-w-6xl mx-auto">

        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs uppercase tracking-widest text-muted font-medium mb-4">
            Reference
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Documentation
          </h2>
          <p className="mt-4 text-muted text-lg max-w-xl">
            Everything you need to know — from installation to agent architecture.
          </p>
        </motion.div>

        <div className="relative mb-0 overflow-x-auto">
          <div className="flex min-w-max border-b border-border">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { if (el) tabRefs.current.set(tab.id, el); }}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "relative px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive ? "text-foreground" : "text-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-px bg-accent"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border border-t-0 border-border rounded-b bg-surface">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6 md:p-10"
            >
              {tabContent(activeTab)}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
