import { motion } from "motion/react";

interface DiscussionCompleteCardProps {
  answerCount: number;
}

export function DiscussionCompleteCard({
  answerCount,
}: DiscussionCompleteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="border border-border bg-card p-6 text-center"
    >
      {/* Green checkmark */}
      <div className="flex justify-center mb-3">
        <svg
          className="h-8 w-8 text-success"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h3 className="text-sm font-medium text-foreground mb-1">
        Discussion Complete
      </h3>

      <p className="text-xs text-muted-foreground mb-4">
        {answerCount} {answerCount === 1 ? "question" : "questions"} answered
      </p>

      {/* Execution queued indicator */}
      <div className="flex items-center justify-center gap-2">
        <svg
          className="h-3.5 w-3.5 text-simple-accent animate-spin"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            strokeDasharray="28"
            strokeDashoffset="8"
          />
        </svg>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Execution queued...
        </span>
      </div>
    </motion.div>
  );
}
