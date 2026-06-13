import { CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProcessingSteps({
  title,
  steps
}: {
  title: string;
  steps: string[];
}) {
  return (
    <Card className="glass-panel overflow-hidden border-primary/25">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
          <div>
            <p className="font-black text-white">{title}</p>
            <p className="text-sm text-muted-foreground">
              Keep this tab open while DabbaDoc prepares your result.
            </p>
          </div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="loading-bar h-full rounded-full bg-primary" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={
                    index === 0
                      ? "h-4 w-4 text-primary"
                      : "h-4 w-4 text-muted-foreground"
                  }
                />
                <p className="text-sm font-semibold text-white">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
