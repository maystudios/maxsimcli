import { motion } from "motion/react";
import type { AnsweredQuestion } from "@/components/providers/discussion-provider";

interface AnsweredCardProps {
  answer: AnsweredQuestion;
}

export function AnsweredCard({ answer }: AnsweredCardProps) {
  const displayAnswer =
    answer.selectedLabels.length > 0
      ? answer.selectedLabels.join(", ")
      : answer.freeText.slice(0, 80) +
        (answer.freeText.length > 80 ? "..." : "");

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 text-xs text-muted-foreground">
        {/* Green checkmark */}
        <svg
          className="h-3.5 w-3.5 text-success shrink-0"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6.5 12.5l-4-4 1.4-1.4L6.5 9.7l5.6-5.6 1.4 1.4z" />
        </svg>

        {/* Header in teal mono */}
        <span className="font-mono text-simple-accent shrink-0">
          {answer.header}
        </span>

        {/* Answer text truncated */}
        <span className="text-foreground/70 truncate">{displayAnswer}</span>
      </div>
    </motion.div>
  );
}
