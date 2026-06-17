import { Camera, Focus, Lightbulb, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tips = [
  {
    icon: Focus,
    title: "Move closer",
    detail: "Fill the frame with the bill or label text."
  },
  {
    icon: Lightbulb,
    title: "Too dark?",
    detail: "Use brighter light and avoid shadows."
  },
  {
    icon: Maximize2,
    title: "Keep it flat",
    detail: "Place the label or receipt on a steady surface."
  },
  {
    icon: Camera,
    title: "Edges visible",
    detail: "Keep receipt edges and ingredients panel inside the photo."
  }
];

export function ScanGuide({ title = "Smart scan guide" }: { title?: string }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div key={tip.title} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-white">{tip.title}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{tip.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
