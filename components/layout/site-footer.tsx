import { Disclaimer } from "@/components/common/disclaimer";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0e16]/60 px-4 py-10 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <DabbaDocLogo href="/" size="sm" />
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Food health intelligence for Indian families. Scan before you eat.
          </p>
        </div>
        <Disclaimer />
      </div>
    </footer>
  );
}
