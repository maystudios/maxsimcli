"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { cn } from "@/lib/utils";

interface PlanEditorProps {
  initialContent: string;
  filePath: string;
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
}

/**
 * CodeMirror 6 Markdown editor with oneDark theme and save functionality.
 * Supports Ctrl+S / Cmd+S keyboard shortcut for saving.
 */
export function PlanEditor({
  initialContent,
  filePath,
  onSave,
  onClose,
}: PlanEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const contentRef = useRef(content);

  // Keep ref in sync for keymap handler
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      setDirty(value !== initialContent);
    },
    [initialContent]
  );

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(contentRef.current);
      setDirty(false);
    } catch (err) {
      console.error("[plan-editor] Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [onSave, saving]);

  const handleClose = useCallback(() => {
    if (dirty) {
      const confirmed = window.confirm(
        "Unsaved changes -- discard?"
      );
      if (!confirmed) return;
    }
    onClose();
  }, [dirty, onClose]);

  // Ctrl+S / Cmd+S keymap extension
  const saveKeymap = keymap.of([
    {
      key: "Mod-s",
      run: () => {
        handleSave();
        return true;
      },
    },
  ]);

  // Also capture Ctrl+S at the document level to prevent browser default
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          {/* File path */}
          <span className="text-sm font-mono text-muted-foreground">
            {filePath}
          </span>

          {/* Dirty indicator */}
          {dirty && (
            <span className="text-xs px-1.5 py-0.5 rounded-sm bg-warning/20 text-warning font-mono">
              unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save button */}
          {dirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md font-mono",
                "bg-accent text-foreground",
                "hover:bg-accent-glow",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
              )}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "text-xs px-3 py-1.5 rounded-md font-mono",
              "bg-muted text-muted-foreground",
              "hover:bg-danger/20 hover:text-danger",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
            )}
          >
            Close
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={content}
          onChange={handleChange}
          theme={oneDark}
          extensions={[markdown({ base: markdownLanguage }), saveKeymap]}
          height="calc(100vh - 56px)"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            bracketMatching: true,
            indentOnInput: true,
          }}
        />
      </div>
    </div>
  );
}
