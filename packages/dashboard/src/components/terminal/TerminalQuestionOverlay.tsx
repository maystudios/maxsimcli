import { useState, useRef, useEffect } from "react";
import { useDiscussion, type AnsweredQuestion } from "@/components/providers/discussion-provider";
import { cn } from "@/lib/utils";

export function TerminalQuestionOverlay() {
  const { phase, currentQuestion, submitAnswer } = useDiscussion();

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOptionId(null);
    setSelectedOptionIds(new Set());
    setFreeText("");
    setDismissed(false);
  }, [currentQuestion?.id]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [freeText]);

  if (phase !== "active" || !currentQuestion) return null;

  // Dismissed: show a small indicator instead of the full overlay
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded bg-accent/20 border border-accent/40 px-2 py-1 text-xs font-mono text-accent hover:bg-accent/30 transition-colors"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        Q&A pending
      </button>
    );
  }

  const isMulti = currentQuestion.multiSelect;
  const hasOptions = currentQuestion.options.length > 0;

  function handleOptionSelect(optionId: string) {
    if (isMulti) {
      setSelectedOptionIds((prev) => {
        const next = new Set(prev);
        if (next.has(optionId)) next.delete(optionId);
        else next.add(optionId);
        return next;
      });
    } else {
      setSelectedOptionId(optionId);
    }
  }

  function handleTextChange(text: string) {
    setFreeText(text);
    if (!isMulti && text.length > 0) {
      setSelectedOptionId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const canSubmit = isMulti
    ? selectedOptionIds.size > 0 || freeText.trim().length > 0
    : selectedOptionId !== null || freeText.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit || !currentQuestion) return;

    let answer: AnsweredQuestion;

    if (isMulti) {
      const selectedLabels = currentQuestion.options
        .filter((o) => selectedOptionIds.has(o.id))
        .map((o) => o.label);
      answer = {
        questionId: currentQuestion.id,
        header: currentQuestion.header,
        selectedOptionIds: Array.from(selectedOptionIds),
        selectedLabels,
        freeText: freeText.trim(),
      };
    } else if (selectedOptionId) {
      const opt = currentQuestion.options.find((o) => o.id === selectedOptionId);
      answer = {
        questionId: currentQuestion.id,
        header: currentQuestion.header,
        selectedOptionIds: [selectedOptionId],
        selectedLabels: opt ? [opt.label] : [],
        freeText: "",
      };
    } else {
      answer = {
        questionId: currentQuestion.id,
        header: currentQuestion.header,
        selectedOptionIds: [],
        selectedLabels: [],
        freeText: freeText.trim(),
      };
    }

    submitAnswer(answer);
  }

  return (
    <div className="absolute top-0 inset-x-0 z-20 border-b border-accent/30 bg-card/95 backdrop-blur-sm shadow-lg">
      <div className="flex flex-col gap-2 p-3 sm:p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block bg-accent/20 border border-accent/40 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-accent shrink-0">
              {currentQuestion.header}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Answer below or dismiss
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
            title="Dismiss (question stays pending)"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Question text */}
        <p className="text-sm text-foreground leading-relaxed">
          {currentQuestion.question}
        </p>

        {/* Option buttons */}
        {hasOptions && (
          <div className="flex flex-wrap gap-1.5">
            {currentQuestion.options.map((option) => {
              const isSelected = isMulti
                ? selectedOptionIds.has(option.id)
                : selectedOptionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option.id)}
                  title={option.description || undefined}
                  className={cn(
                    "border px-2 py-1 text-xs font-mono transition-colors",
                    isSelected
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Free-text input + submit */}
        <div className="flex items-end gap-2">
          <div className="flex-1 border border-border bg-muted/10 px-2 py-1.5">
            <textarea
              ref={textareaRef}
              value={freeText}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              rows={1}
              className="w-full resize-none overflow-hidden bg-transparent font-mono text-xs text-foreground outline-none leading-relaxed placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "shrink-0 border px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors",
              !canSubmit
                ? "border-border text-muted-foreground cursor-not-allowed"
                : "border-accent bg-accent/10 text-accent hover:bg-accent hover:text-background"
            )}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
