"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  FileText,
  History,
  Home,
  LogOut,
  ScanLine,
  Settings,
  Upload,
  UserRound,
  Utensils
} from "lucide-react";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/upload-receipt", label: "Receipt scan", icon: Upload },
  { href: "/dashboard/label-scan", label: "LabelScan", icon: ScanLine },
  { href: "/dashboard/food-diary", label: "Food diary", icon: Utensils },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/pricing", label: "Premium", icon: BadgeCheck },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function DashboardNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "glass-panel custom-scrollbar sticky top-4 hidden h-[calc(100vh-2rem)] w-64 overflow-y-auto rounded-2xl p-4 lg:block",
        className
      )}
    >
      <div className="mb-6 border-b border-white/10 px-2 pb-5">
        <DabbaDocLogo href="/" size="md" />
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "border-r-4 border-primary bg-primary/15 text-primary shadow-[0_0_20px_rgba(129,247,89,0.12)]"
                  : "text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="mt-6 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-secondary/30 hover:bg-secondary/10 hover:text-orange-100"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Logout
      </button>
    </aside>
  );
}

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-mobile-nav fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 bg-[#10131c]/92 px-2 pb-safe pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:hidden">
      <div className="custom-scrollbar mx-auto flex max-w-md gap-1 overflow-x-auto">
        {links.slice(0, 6).map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-w-20 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition",
                active
                  ? "scale-[1.03] bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
