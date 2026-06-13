import {
  DashboardMobileNav,
  DashboardNav
} from "@/components/dashboard/dashboard-nav";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen px-3 py-3 pb-28 sm:px-6 lg:px-8 lg:pb-4">
      <header className="glass-panel sticky top-3 z-40 mb-4 flex items-center justify-between rounded-2xl px-4 py-3 lg:hidden">
        <DabbaDocLogo href="/" size="sm" />
        <div className="text-right">
          <p className="mono-label text-[10px] text-muted-foreground">Status</p>
          <p className="text-sm font-bold text-primary">Ready</p>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-6">
        <DashboardNav />
        <main className="min-w-0 flex-1 pb-12">{children}</main>
      </div>
      <DashboardMobileNav />
    </div>
  );
}
