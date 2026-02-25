import { useCallback } from "react";
import { cn } from "@/lib/utils";
import type { PlanTask } from "@/lib/types";

interface TaskListProps {
  tasks: PlanTask[];
  planPath: string;
  planContent: string;
  onContentChange: (newContent: string) => void;
}

/**
 * Renders a list of tasks with toggleable checkboxes.
 * Checkbox toggle modifies the raw plan Markdown content and writes back via API.
 */
export function TaskList({
  tasks,
  planPath,
  planContent,
  onContentChange,
}: TaskListProps) {
  const handleToggle = useCallback(
    async (taskIndex: number) => {
      const task = tasks[taskIndex];
      if (!task) return;

      // Find the <done> line for this task and toggle checkbox marker.
      // Tasks in PLAN.md use <done> tags with text content.
      // We toggle by finding the task's <task> block and toggling its completed state.
      //
      // The plan Markdown uses `- [ ]` or `- [x]` patterns in done criteria,
      // or we can look for the task name to locate the right section.
      let updatedContent = planContent;

      // Strategy: find the task name in content, then locate nearest checkbox pattern
      // Task names appear in <name> tags: <name>Task N: Description</name>
      const taskNameEscaped = task.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const taskNamePattern = new RegExp(
        `<name>\\s*${taskNameEscaped}\\s*</name>`
      );
      const nameMatch = taskNamePattern.exec(updatedContent);

      if (nameMatch) {
        // Find the <done> section for this task
        const afterName = updatedContent.slice(nameMatch.index);
        const doneMatch = afterName.match(/<done>([\s\S]*?)<\/done>/);

        if (doneMatch) {
          const doneContent = doneMatch[1];
          const doneStart = nameMatch.index + afterName.indexOf(doneMatch[0]);
          const doneEnd = doneStart + doneMatch[0].length;

          // Toggle: if done text exists but task not completed, mark as completed
          // We add a [x] prefix or remove it
          let newDoneContent: string;
          if (task.completed) {
            // Uncheck: remove leading [x] marker
            newDoneContent = doneContent.replace(/^\s*\[x\]\s*/, "");
          } else {
            // Check: add [x] marker at start
            newDoneContent = `[x] ${doneContent.trim()}`;
          }

          updatedContent =
            updatedContent.slice(0, doneStart) +
            `<done>${newDoneContent}</done>` +
            updatedContent.slice(doneEnd);
        }
      }

      // Write updated content back via API
      if (updatedContent !== planContent) {
        onContentChange(updatedContent);

        try {
          // Extract relative path segments after .planning/
          const pathAfterPlanning = planPath.replace(/^\.planning[\\/]/, "");
          const segments = pathAfterPlanning.split(/[\\/]/);

          await fetch(`/api/plan/${segments.join("/")}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: updatedContent }),
          });
        } catch (err) {
          console.error("[task-list] Failed to write checkbox change:", err);
        }
      }
    },
    [tasks, planPath, planContent, onContentChange]
  );

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No tasks defined</p>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map((task, index) => (
        <div
          key={index}
          className={cn(
            "flex items-start gap-2 py-1 px-2 rounded-md transition-colors",
            "hover:bg-muted/50",
            task.completed && "opacity-60"
          )}
        >
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => handleToggle(index)}
            className={cn(
              "mt-0.5 flex-shrink-0 w-4 h-4 rounded-sm border transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-accent/50",
              task.completed
                ? "bg-success border-success text-background"
                : "border-muted-foreground hover:border-accent"
            )}
            aria-label={`Toggle ${task.name}`}
          >
            {task.completed && (
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8l3 3 7-7" />
              </svg>
            )}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-sans",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                {task.name}
              </span>

              {/* Type badge */}
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-sm font-mono",
                  task.type.startsWith("checkpoint")
                    ? "bg-warning/20 text-warning"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {task.type}
              </span>
            </div>

            {/* Files list */}
            {task.files.length > 0 && (
              <div className="mt-0.5">
                {task.files.map((file, fileIdx) => (
                  <span
                    key={fileIdx}
                    className="text-xs font-mono text-muted-foreground mr-2"
                  >
                    {file}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
