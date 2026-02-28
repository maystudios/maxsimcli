import { AnimatePresence, motion } from "motion/react";

interface ConfirmationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="mx-4 w-full max-w-sm border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-foreground leading-relaxed mb-6">
              This will end discussion and start execution. Continue?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="border border-border px-4 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="bg-simple-accent/15 border border-simple-accent px-4 py-2 text-xs font-mono uppercase tracking-widest text-simple-accent transition-colors hover:bg-simple-accent hover:text-background"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
