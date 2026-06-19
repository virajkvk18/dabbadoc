import Link from "next/link";
import { Info, LogIn, ScanLine, Upload } from "lucide-react";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0e16]/80 backdrop-blur-2xl">
      <div className="flex min-h-16 w-full items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:px-6">
        <DabbaDocLogo href="/" size="sm" className="min-w-0" />
        <nav className="hidden items-center gap-5 text-sm font-semibold text-muted-foreground lg:flex">
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>
          <Link href="/about" className="transition hover:text-white">
            About
          </Link>
          <Link href="/pricing" className="transition hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard/food-diary" className="transition hover:text-white">
            Food diary
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login/Signup</span>
              <span className="sm:hidden">Login</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex lg:hidden">
            <Link href="/about">
              <Info className="h-4 w-4" />
              About
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/upload-receipt">
              <Upload className="hidden h-4 w-4 sm:block" />
              <ScanLine className="h-4 w-4 sm:hidden" />
              <span>Scan</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
