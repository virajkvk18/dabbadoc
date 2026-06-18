import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  detail?: string;
  variant?: "default" | "primary" | "secondary";
  suffix?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  detail,
  variant = "default",
  suffix,
  className
}: StatCardProps) {
  const variantStyles = {
    default: {
      surface: "border-white/10",
      icon: "border-white/10 bg-white/[0.06] text-white"
    },
    primary: {
      surface: "border-primary/20 bg-primary/[0.035]",
      icon: "border-primary/20 bg-primary/15 text-primary"
    },
    secondary: {
      surface: "border-secondary/20 bg-secondary/[0.035]",
      icon: "border-secondary/20 bg-secondary/15 text-secondary"
    }
  };
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "glass-panel flex min-h-32 flex-col justify-between gap-5 overflow-hidden rounded-2xl p-4 sm:p-5",
        styles.surface,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border", styles.icon)}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-label leading-4 text-muted-foreground">{label}</p>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black leading-none text-white sm:text-3xl">
          {value}
          {suffix ? (
            <span className="ml-1 text-sm font-semibold text-muted-foreground">
              {suffix}
            </span>
          ) : null}
        </p>
        {detail ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}
