import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function HealthScoreGauge({
  score,
  category,
  className
}: {
  score: number;
  category: string;
  className?: string;
}) {
  const degrees = Math.round((score / 100) * 360);
  const scoreColor =
    score >= 75 ? "#81f759" : score >= 55 ? "#fd8b00" : "#ffb4ab";

  return (
    <Card className={cn("glass-panel neon-bloom-primary overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <p className="mono-label mb-4 text-[11px] text-muted-foreground">
            Dabba Health Index
          </p>
          <div
            className="grid h-48 w-48 place-items-center rounded-full p-2"
            style={{
              background: `conic-gradient(${scoreColor} ${degrees}deg, rgba(255,255,255,0.08) 0deg)`
            }}
          >
            <div className="grid h-36 w-36 place-items-center rounded-full border border-white/10 bg-[#071018] shadow-[inset_0_0_28px_rgba(0,0,0,0.45)]">
              <div>
                <p className="text-5xl font-black text-white drop-shadow-[0_0_14px_rgba(129,247,89,0.25)]">
                  {score}
                </p>
                <p className="mono-label text-xs text-muted-foreground">
                  /100
                </p>
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm font-semibold text-primary">{category}</p>
        </div>
      </CardContent>
    </Card>
  );
}
