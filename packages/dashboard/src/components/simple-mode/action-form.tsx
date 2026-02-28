import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSimpleMode } from "@/components/providers/simple-mode-provider";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { ActionDef } from "@/lib/simple-mode-actions";

interface ActionFormProps {
  action: ActionDef;
  onExecute: (cmd: string) => void;
}

export function ActionForm({ action, onExecute }: ActionFormProps) {
  const { inputValues, setInput, reset } = useSimpleMode();
  const { roadmap } = useDashboardData();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showReset, setShowReset] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Derive pre-fill value for requiresInput actions
  const prefill = (() => {
    if (!action.requiresInput) return "";
    const nextPhase = roadmap?.phases?.find(
      p => !p.roadmap_complete && (p.disk_status === "empty" || p.disk_status === "no_directory")
    );
    if (nextPhase) return `Phase ${nextPhase.number}: ${nextPhase.name}`;
    return "";
  })();

  const value = inputValues[action.id] ?? prefill;

  // Auto-resize on mount and value change
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleChange(v: string) {
    setInput(action.id, v);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function buildCommandString() {
    const trimmed = value.trim();
    if (action.command === "") return "";
    return trimmed ? `${action.command} "${trimmed}"` : action.command;
  }

  function handleSubmit() {
    if (action.requiresInput && !value.trim()) return;
    if (action.id === "view-roadmap") return;
    const cmd = buildCommandString();
    if (cmd) onExecute(cmd);
  }

  function handleResetClick() {
    if (confirmReset) {
      reset();
      setConfirmReset(false);
      setShowReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  }

  const isDisabledSubmit = action.requiresInput && !value.trim();

  return (
    <div className="flex flex-col gap-3 relative">
      <p className="text-xs text-muted-foreground">
        {action.requiresInput
          ? "Describe what this phase should accomplish."
          : "Add optional context (or leave blank to use defaults)."}
      </p>

      <div className="border border-border bg-muted/10 px-3 py-2 flex gap-2 items-start">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { handleChange(e.target.value); handleInput(); }}
          onKeyDown={handleKeyDown}
          placeholder={action.requiresInput
            ? "e.g. Phase 31: Simple Mode UI Shell"
            : "Additional context (optional)"}
          rows={1}
          className="w-full resize-none overflow-hidden bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground outline-none leading-relaxed"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isDisabledSubmit}
          className={cn(
            "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors",
            isDisabledSubmit
              ? "border-border text-muted-foreground cursor-not-allowed"
              : "border-simple-accent bg-simple-accent/10 text-simple-accent hover:bg-simple-accent hover:text-background"
          )}
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M2 2l8 4-8 4V2z" />
          </svg>
          Run in Terminal
        </button>

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setShowReset(v => !v)}
            aria-label="More options"
            className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <circle cx="4" cy="8" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="12" cy="8" r="1.2" />
            </svg>
          </button>
          {showReset && (
            <div className="absolute right-0 bottom-8 z-20 border border-border bg-card shadow-lg min-w-max">
              <button
                type="button"
                onClick={handleResetClick}
                className={cn(
                  "flex w-full items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors",
                  confirmReset
                    ? "text-danger hover:bg-danger/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                )}
              >
                {confirmReset ? "Click again to confirm reset" : "Reset Simple Mode"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
