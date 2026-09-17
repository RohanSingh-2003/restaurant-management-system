import type { ReactNode } from 'react';

interface AppLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

/**
 * AppLayout
 * Unified responsive layout system for all 5 roles (Manager, Waiter, Cook, Customer, Admin).
 * Enforces synchronized layout calculation between Sidebar, Header, and Main Content:
 * - Desktop: Sidebar participates in normal flex flow with explicit shrink-0 width.
 * - Mobile: Sidebar renders as an off-canvas drawer; main area occupies 100% of viewport.
 * - Content: Main content wrapper automatically stretches to 100% of available viewport width
 *   when sidebar is either expanded (240px) or collapsed (68px).
 * - Alignment: Header and Main share identical responsive horizontal padding (px-4 sm:px-6).
 */
export function AppLayout({
  sidebar,
  header,
  children,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-25 w-full min-w-0">
      {/* Sidebar: Off-canvas fixed overlay on mobile; in-flow shrink-0 sidebar on desktop */}
      {sidebar}

      {/* Main Area: Fills 100% of the remaining viewport width */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Header: Starts immediately after sidebar and spans to the right screen edge */}
        <div className="shrink-0 w-full min-w-0">
          {header}
        </div>

        {/* Main Content: Scrollable container with unified responsive padding */}
        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 py-6">
          <div className="w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
