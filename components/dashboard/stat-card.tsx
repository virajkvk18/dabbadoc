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
      glow: "",
      icon: "bg-white/10 text-white"
    },
    primary: {
      glow: "hover:shadow-glow-sm",
      icon: "bg-primary/20 text-primary"
    },
    secondary: {
      glow: "hover:shadow-warm-sm",
      icon: "bg-secondary/20 text-secondary"
    }
  };
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "glass-panel group flex min-h-36 items-start gap-4 overflow-hidden rounded-2xl p-5 transition-all duration-250 hover:-translate-y-1",
        styles.glow,
        className
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-250 group-hover:scale-110",
          styles.icon
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-label text-muted-foreground">{label}</p>
        <p className="mt-3 text-2xl font-black leading-none text-white">
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
