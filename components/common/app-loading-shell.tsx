import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";

export function AppLoadingShell({
  label = "Preparing your food health view"
}: {
  label?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel overflow-hidden rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <DabbaDocLogo size="sm" showText={false} />
          <div className="min-w-0 flex-1">
            <p className="mono-label text-[10px] text-primary">DabbaDoc</p>
            <p className="mt-1 text-lg font-black text-white">{label}</p>
          </div>
          <span className="loader-ring" />
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="loading-bar h-full rounded-full bg-primary" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="skeleton-panel h-36 rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="skeleton-panel h-80 rounded-2xl border border-white/10 bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="skeleton-panel h-36 rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
