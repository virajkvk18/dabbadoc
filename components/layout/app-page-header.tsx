import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AppPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: "primary" | "secondary" | "tertiary";
  actions?: ReactNode;
  stats?: Array<{ label: string; value: string }>;
  className?: string;
};

const accentClasses = {
  primary: "border-primary/30 bg-primary/10 text-primary brand-glow",
  secondary: "border-secondary/30 bg-secondary/15 text-secondary orange-glow",
  tertiary: "border-sky-300/25 bg-sky-400/10 text-sky-200"
};

export function AppPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  accent = "primary",
  actions,
  stats,
  className
}: AppPageHeaderProps) {
  return (
    <section
      className={cn(
        "glass-panel scan-frame overflow-hidden rounded-2xl p-5 sm:p-6",
        className
      )}
    >
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span
            className={cn(
              "grid h-14 w-14 shrink-0 place-items-center rounded-2xl border",
              accentClasses[accent]
            )}
          >
            <Icon className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <Badge variant={accent === "secondary" ? "secondary" : "default"}>
              {eyebrow}
            </Badge>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-white md:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
      {stats && stats.length > 0 ? (
        <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mono-label text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-lg font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
