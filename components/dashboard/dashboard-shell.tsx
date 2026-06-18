import type { ReactNode } from "react";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";
import { FloatingFoodChatbot } from "@/components/chat/food-history-chat";
import { DashboardMobileNav, DashboardNav } from "@/components/dashboard/dashboard-nav";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-3 py-3 pb-28 sm:px-5 lg:px-4 xl:px-5 2xl:px-6 lg:pb-6">
      <header className="glass-panel sticky top-3 z-40 mb-4 flex items-center justify-between rounded-2xl px-4 py-3 lg:hidden">
        <DabbaDocLogo href="/" size="sm" />
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <p className="text-xs font-bold text-primary">Active</p>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1800px] gap-5">
        <DashboardNav />
        <main className="page-enter stagger-children min-w-0 flex-1 pb-16">
          {children}
        </main>
      </div>
      <FloatingFoodChatbot />
      <DashboardMobileNav />
    </div>
  );
}
