import type { ReactNode } from "react";

interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

/**
 * App shell layout: sidebar on the left, scrollable main content on the right.
 *
 * Uses flex h-screen so the sidebar stays fixed while content scrolls.
 * On small screens the sidebar collapses (hidden below md breakpoint).
 */
export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: hidden on small screens, visible on md+ */}
      <div className="hidden md:flex">
        {sidebar}
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
