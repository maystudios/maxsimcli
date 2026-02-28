import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import type {
  DiscussionQuestion,
  AnsweredQuestion,
} from "@/components/providers/discussion-provider";
import { OptionCard } from "./option-card";
import { OptionPreviewPanel } from "./option-preview-panel";

interface QuestionCardProps {
  question: DiscussionQuestion;
  onSubmit: (answer: AnsweredQuestion) => void;
}

export function QuestionCard({ question, onSubmit }: QuestionCardProps) {
  // Single-select state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  // Multi-select state
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(
    new Set()
  );
  const [freeText, setFreeText] = useState("");
  const [focusedOptionId, setFocusedOptionId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [freeText]);

  // Reset selection state when question changes
  useEffect(() => {
    setSelectedOptionId(null);
    setSelectedOptionIds(new Set());
    setFreeText("");
    setFocusedOptionId(null);
  }, [question.id]);

  function handleOptionSelect(optionId: string) {
    if (question.multiSelect) {
      setSelectedOptionIds((prev) => {
        const next = new Set(prev);
        if (next.has(optionId)) {
          next.delete(optionId);
        } else {
          next.add(optionId);
        }
        return next;
      });
    } else {
      // Single-select: set the option (does NOT clear freeText per CONTEXT.md)
      setSelectedOptionId(optionId);
    }
  }

  function handleTextChange(text: string) {
    setFreeText(text);
    // Single-select: typing deselects card
    if (!question.multiSelect && text.length > 0) {
      setSelectedOptionId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;

    if (question.multiSelect) {
      const selectedLabels = question.options
        .filter((o) => selectedOptionIds.has(o.id))
        .map((o) => o.label);
      onSubmit({
        questionId: question.id,
        header: question.header,
        selectedOptionIds: Array.from(selectedOptionIds),
        selectedLabels,
        freeText: freeText.trim(),
      });
    } else {
      // Single-select: card wins if selected, else freeText
      if (selectedOptionId) {
        const opt = question.options.find((o) => o.id === selectedOptionId);
        onSubmit({
          questionId: question.id,
          header: question.header,
          selectedOptionIds: [selectedOptionId],
          selectedLabels: opt ? [opt.label] : [],
          freeText: "",
        });
      } else {
        onSubmit({
          questionId: question.id,
          header: question.header,
          selectedOptionIds: [],
          selectedLabels: [],
          freeText: freeText.trim(),
        });
      }
    }
  }

  const canSubmit = question.multiSelect
    ? selectedOptionIds.size > 0 || freeText.trim().length > 0
    : selectedOptionId !== null || freeText.trim().length > 0;

  // Find the focused option's markdown content for preview
  const focusedOption = focusedOptionId
    ? question.options.find((o) => o.id === focusedOptionId)
    : null;
  const previewMarkdown = focusedOption?.markdown ?? "";

  return (
    <div className="border border-border bg-card p-4 relative">
      {/* Teal header pill */}
      <span className="inline-block bg-simple-accent/20 border border-simple-accent/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-simple-accent mb-2">
        {question.header}
      </span>

      {/* Question text (markdown) */}
      <div className="text-sm text-foreground leading-relaxed mb-4 prose prose-invert prose-sm max-w-none [&_a]:text-simple-accent [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs">
        <Markdown>{question.question}</Markdown>
      </div>

      {/* Option cards */}
      {question.options.length > 0 && (
        <div className="relative">
          <div className="grid gap-2 mb-3">
            {question.options.map((option) => {
              const isSelected = question.multiSelect
                ? selectedOptionIds.has(option.id)
                : selectedOptionId === option.id;

              return (
                <OptionCard
                  key={option.id}
                  option={option}
                  selected={isSelected}
                  variant={question.multiSelect ? "checkbox" : "radio"}
                  onSelect={() => handleOptionSelect(option.id)}
                  onFocus={() => setFocusedOptionId(option.id)}
                  onBlur={() => setFocusedOptionId(null)}
                />
              );
            })}
          </div>

          {/* Preview panel for option with markdown */}
          <OptionPreviewPanel
            markdown={previewMarkdown}
            visible={!!previewMarkdown}
          />
        </div>
      )}

      {/* Free-form textarea */}
      <div className="border border-border bg-muted/10 px-3 py-2 mb-3">
        <textarea
          ref={textareaRef}
          value={freeText}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="w-full resize-none overflow-hidden bg-transparent font-mono text-xs text-foreground outline-none leading-relaxed"
        />
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors",
          !canSubmit
            ? "border-border text-muted-foreground cursor-not-allowed"
            : "border-simple-accent bg-simple-accent/10 text-simple-accent hover:bg-simple-accent hover:text-background"
        )}
      >
        Submit
      </button>
    </div>
  );
}
