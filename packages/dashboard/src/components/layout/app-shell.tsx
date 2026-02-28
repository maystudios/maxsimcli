import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
  onMobileMenuClose?: () => void;
  headerRight?: ReactNode;
  simpleMode?: boolean;
}

/**
 * App shell layout: sidebar on the left, scrollable main content on the right.
 *
 * On desktop (md+): sidebar is fixed on the left, content scrolls.
 * On mobile: a top bar with a hamburger button opens the sidebar as a full-height overlay.
 */
export function AppShell({
  sidebar,
  children,
  mobileMenuOpen = false,
  onMobileMenuToggle,
  onMobileMenuClose,
  headerRight,
  simpleMode = false,
}: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      {/* Mobile top bar */}
      <div className={cn(
        "flex shrink-0 items-center justify-between border-b bg-card px-4 py-3 md:hidden",
        simpleMode ? "border-simple-accent/30 bg-simple-accent/5" : "border-border"
      )}>
        <span className="text-sm font-bold tracking-tight text-foreground">
          MAXSIM
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">Dashboard</span>
        </span>
        <div className="flex items-center gap-2">
          {headerRight}
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onMobileMenuClose}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-64">
            {sidebar}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden shrink-0 md:flex">
        {sidebar}
      </div>

      {/* Main content */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
