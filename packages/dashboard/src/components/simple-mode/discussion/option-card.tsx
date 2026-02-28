import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DiscussionOption } from "@/components/providers/discussion-provider";

interface OptionCardProps {
  option: DiscussionOption;
  selected: boolean;
  variant: "radio" | "checkbox";
  onSelect: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export function OptionCard({
  option,
  selected,
  variant,
  onSelect,
  onFocus,
  onBlur,
}: OptionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const lines = option.description.split("\n");
  const hasMore = lines.length > 1 || option.description.length > 120;
  const displayText = expanded ? option.description : lines[0]?.slice(0, 120) ?? "";

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        "flex items-start gap-3 border p-3 text-left transition-colors w-full",
        selected
          ? "border-simple-accent bg-simple-accent/10"
          : "border-border bg-card hover:border-muted-foreground/40"
      )}
    >
      {/* Selection indicator */}
      <span className="mt-0.5 shrink-0">
        {variant === "radio" ? (
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center border",
              selected
                ? "border-simple-accent"
                : "border-muted-foreground"
            )}
            style={{ borderRadius: "50%" }}
          >
            {selected && (
              <span
                className="h-2 w-2 bg-simple-accent"
                style={{ borderRadius: "50%" }}
              />
            )}
          </span>
        ) : (
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center border",
              selected
                ? "border-simple-accent bg-simple-accent/20"
                : "border-muted-foreground"
            )}
          >
            {selected && (
              <svg
                className="h-3 w-3 text-simple-accent"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="M2 6l3 3 5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        )}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">
          {option.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {displayText}
          {!expanded && hasMore && "..."}
        </p>
        {hasMore && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                e.preventDefault();
                setExpanded((v) => !v);
              }
            }}
            className="text-[10px] text-simple-accent mt-1 inline-block cursor-pointer hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </span>
        )}
      </div>
    </button>
  );
}
