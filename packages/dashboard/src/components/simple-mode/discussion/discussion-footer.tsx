interface DiscussionFooterProps {
  onAskMore: () => void;
  onDoneExecute: () => void;
  disabled: boolean;
}

export function DiscussionFooter({
  onAskMore,
  onDoneExecute,
  disabled,
}: DiscussionFooterProps) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-border bg-background/95 backdrop-blur px-4 py-3">
      <button
        type="button"
        onClick={onAskMore}
        disabled={disabled}
        className="border border-simple-accent/50 px-4 py-2 text-xs font-mono uppercase tracking-widest text-simple-accent transition-colors hover:bg-simple-accent/10 disabled:opacity-50"
      >
        Ask me more
      </button>
      <button
        type="button"
        onClick={onDoneExecute}
        disabled={disabled}
        className="bg-simple-accent/15 border border-simple-accent px-4 py-2 text-xs font-mono uppercase tracking-widest text-simple-accent transition-colors hover:bg-simple-accent hover:text-background disabled:opacity-50"
      >
        Done, execute
      </button>
    </div>
  );
}
