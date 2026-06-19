"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Barcode,
  BookOpenText,
  FileText,
  History,
  Home,
  LogOut,
  ScanLine,
  Settings,
  Upload,
  UserRound,
  UsersRound,
  Utensils
} from "lucide-react";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";
import { cn } from "@/lib/utils";

type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type MobileNavLinkItem = NavLinkItem & {
  fab?: boolean;
};

const links: NavLinkItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/my-diary", label: "My Diary", icon: BookOpenText },
  { href: "/dashboard/upload-receipt", label: "Receipt scan", icon: Upload },
  { href: "/dashboard/label-scan", label: "LabelScan", icon: ScanLine },
  { href: "/dashboard/barcode-scan", label: "Barcode scan", icon: Barcode },
  { href: "/dashboard/food-diary", label: "Food diary", icon: Utensils },
  { href: "/dashboard/family", label: "Family", icon: UsersRound },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/reports", label: "Reports", icon: FileText }
];

const bottomLinks: NavLinkItem[] = [
  { href: "/pricing", label: "Premium", icon: BadgeCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound }
];

const mobileLinks: MobileNavLinkItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/my-diary", label: "Diary", icon: BookOpenText },
  { href: "/dashboard/label-scan", label: "Scan", icon: ScanLine, fab: true },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/profile", label: "You", icon: UserRound }
];

export function DashboardNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  async function logout() {
    setPendingHref("/");
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/");
  }

  function NavLink({ link }: { link: NavLinkItem }) {
    const Icon = link.icon;
    const active =
      pathname === link.href ||
      (link.href !== "/dashboard" && pathname.startsWith(link.href));

    return (
      <Link
        href={link.href}
        onClick={() => {
          if (!active) setPendingHref(link.href);
        }}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
          active
            ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary shadow-[inset_0_0_0_1px_rgba(129,247,89,0.2)]"
            : pendingHref === link.href
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-white/[0.08] hover:text-white"
        )}
      >
        {active ? (
          <span className="absolute left-0 top-1/4 h-1/2 w-0.5 rounded-r-full bg-primary" />
        ) : null}
        <Icon className="h-4 w-4 shrink-0" />
        {link.label}
        {pendingHref === link.href ? (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(129,247,89,0.7)]" />
        ) : null}
      </Link>
    );
  }

  return (
    <aside
      className={cn(
        "glass-panel custom-scrollbar sticky top-4 hidden h-[calc(100vh-2rem)] w-[220px] shrink-0 overflow-y-auto rounded-2xl p-4 lg:flex lg:flex-col",
        className
      )}
    >
      <div className="mb-6 border-b border-white/10 px-2 pb-5">
        <DabbaDocLogo href="/" size="md" />
      </div>
      {pendingHref ? (
        <div className="mb-3 overflow-hidden rounded-full bg-white/10">
          <div className="loading-bar h-1 rounded-full bg-primary" />
        </div>
      ) : null}
      <nav className="space-y-0.5">
        {links.map((link) => (
          <NavLink key={link.href} link={link} />
        ))}
      </nav>
      <div className="my-4 border-t border-white/10" />
      <nav className="space-y-0.5">
        {bottomLinks.map((link) => (
          <NavLink key={link.href} link={link} />
        ))}
      </nav>
      <div className="flex-1" />
      <button
        type="button"
        onClick={logout}
        className="mt-4 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-secondary/30 hover:bg-secondary/10 hover:text-orange-100"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Logout
      </button>
    </aside>
  );
}

export function DashboardMobileNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <nav className="dashboard-mobile-nav fixed inset-x-0 bottom-0 z-50 pb-safe lg:hidden">
      <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e16]/95 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        {pendingHref ? (
          <div className="absolute inset-x-0 top-0 overflow-hidden rounded-t-2xl">
            <div className="loading-bar h-0.5 bg-primary" />
          </div>
        ) : null}
        <div className="flex items-end px-2 py-2">
          {mobileLinks.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));

          if (link.fab) {
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  if (!active) setPendingHref(link.href);
                }}
                className="relative -mt-5 mx-auto flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-primary shadow-[0_0_24px_rgba(129,247,89,0.5),0_0_48px_rgba(129,247,89,0.2)] transition-transform active:scale-95"
              >
                <Icon className="h-5 w-5 text-primary-foreground" />
                {active ? (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0a0e16] bg-primary">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
                  </span>
                ) : null}
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => {
                if (!active) setPendingHref(link.href);
              }}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-all active:scale-95",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
              <span className="whitespace-nowrap">{link.label}</span>
              {active ? <span className="h-1 w-1 rounded-full bg-primary" /> : null}
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
