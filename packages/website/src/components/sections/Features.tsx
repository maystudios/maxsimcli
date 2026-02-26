import { motion } from "motion/react";
import { Brain, Layers, Globe, FileText, Users, Gauge, LayoutDashboard, Wifi, GitBranch, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Meta-Prompting",
    description:
      "Commands load workflows which spawn specialized subagents — each with fresh context and a single responsibility.",
  },
  {
    icon: Layers,
    title: "Context Engineering",
    description:
      "Solves context rot by offloading work to fresh-context subagents. Never lose track of your project state again.",
  },
  {
    icon: LayoutDashboard,
    title: "Live Dashboard",
    description:
      "Real-time web UI with phase progress, inline Markdown editor, todos, blockers, STATE.md editor, and LAN/QR sharing. Bundled inside the CLI — launch with one command.",
  },
  {
    icon: Globe,
    title: "Multi-Runtime Support",
    description:
      "Works with Claude Code, OpenCode, Gemini CLI, and Codex. Install once, use with any AI coding agent.",
  },
  {
    icon: FileText,
    title: "Spec-Driven Development",
    description:
      "Structured planning with phases, research, verification, and UAT. Every step is documented in markdown and persists across sessions.",
  },
  {
    icon: Users,
    title: "11 Specialized Agents",
    description:
      "Researcher, planner, executor, verifier, debugger, codebase mapper, and more — each agent is an expert at its single task.",
  },
  {
    icon: Gauge,
    title: "4 Model Profiles",
    description:
      "Quality, balanced, budget, and tokenburner tiers. Orchestrators use lean models; planners and executors use heavy ones. Override individual agents per project.",
  },
  {
    icon: Zap,
    title: "Wave-Based Parallelization",
    description:
      "Execution plans are grouped into dependency waves and run in parallel with isolated fresh-context subagents, then committed atomically.",
  },
  {
    icon: GitBranch,
    title: "Branching Strategies",
    description:
      "Auto-create git branches per phase or milestone. Configurable templates like maxsim/phase-{N}-{slug} keep your repo organized.",
  },
  {
    icon: Wifi,
    title: "LAN & Tailscale Sharing",
    description:
      "Share the dashboard over your local network or Tailscale VPN. Auto-configures firewall rules and generates a QR code for instant mobile access.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function Features() {
  return (
    <section id="features" className="bg-background py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-widest text-muted font-medium mb-4">
            What's included
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Features
          </h2>
          <p className="mt-4 text-muted text-lg max-w-xl">
            Everything you need for structured, agent-driven development — without the context collapse.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              whileHover="hover"
              className="relative bg-background p-8 group"
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  boxShadow: "inset 0 0 0 1px #3b82f6",
                }}
              />

              <div className="mb-5 inline-flex items-center justify-center w-10 h-10 rounded-none bg-surface text-accent">
                <Icon size={20} strokeWidth={1.5} />
              </div>

              <h3 className="text-foreground font-bold text-lg mb-2 tracking-tight">
                {title}
              </h3>
              <p className="text-muted text-sm leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
