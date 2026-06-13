import Link from "next/link";
import { LogIn, ScanLine, Upload } from "lucide-react";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0e16]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <DabbaDocLogo href="/" size="sm" />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
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
              <span className="hidden sm:inline">Login</span>
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
