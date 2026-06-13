import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function BadgeGrid({ badges }: { badges: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {badges.map((badge) => (
        <div
          key={badge}
          className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-secondary/30 hover:bg-secondary/10"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-secondary/20 bg-secondary/15 text-orange-200 transition group-hover:scale-105">
            <Award className="h-4 w-4" />
          </span>
          <Badge variant="outline">{badge}</Badge>
        </div>
      ))}
    </div>
  );
}
