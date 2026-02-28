import Markdown from "react-markdown";

interface OptionPreviewPanelProps {
  markdown: string;
  visible: boolean;
}

export function OptionPreviewPanel({ markdown, visible }: OptionPreviewPanelProps) {
  if (!visible) return null;

  return (
    <div className="border border-border bg-card p-4 text-xs font-mono text-foreground/80 leading-relaxed overflow-auto max-h-64 lg:absolute lg:right-0 lg:top-0 lg:w-80 lg:translate-x-[calc(100%+0.75rem)] lg:z-10 lg:shadow-lg mt-2 lg:mt-0">
      <Markdown>{markdown}</Markdown>
    </div>
  );
}
