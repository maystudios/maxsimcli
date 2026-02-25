import { motion } from "motion/react";
import { Brain, Layers, Globe, FileText, Users, Gauge, LayoutDashboard } from "lucide-react";

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
    icon: Globe,
    title: "Multi-Runtime Support",
    description:
      "Works with Claude Code, OpenCode, Gemini CLI, and Codex. Install once, use with any AI coding agent.",
  },
  {
    icon: FileText,
    title: "Spec-Driven Development",
    description:
      "Structured planning with phases, research, verification, and UAT. Every step is documented in markdown.",
  },
  {
    icon: Users,
    title: "11 Specialized Agents",
    description:
      "Researcher, planner, executor, verifier, debugger, and more — each agent is an expert at its specific task.",
  },
  {
    icon: Gauge,
    title: "Model Profiles",
    description:
      "Quality, balanced, and budget tiers for optimal cost. Orchestrators use lean models; planners and executors use heavy ones.",
  },
  {
    icon: LayoutDashboard,
    title: "Live Dashboard",
    description:
      "Real-time web UI bundled inside the CLI. View phase progress, todos, blockers, and an interactive terminal — all in one browser tab.",
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
