import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="glass-panel group overflow-hidden">
      <CardContent className="relative flex min-h-36 items-start justify-between p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/15" />
        <div>
          <p className="mono-label text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className="relative grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary brand-glow">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}
