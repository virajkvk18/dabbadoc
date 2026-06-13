import { CalendarDays, ScanLine, Utensils } from "lucide-react";
import { HealthIndexChart } from "@/components/charts/health-index-chart";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const history = [
  { date: "Jun 08", score: 56 },
  { date: "Jun 09", score: 59 },
  { date: "Jun 10", score: 63 },
  { date: "Jun 11", score: 68 },
  { date: "Jun 12", score: 72 }
];

const rows = [
  { title: "Receipt scan", detail: "Maggi, cola, chips, dal, poha", icon: ScanLine },
  { title: "LabelScan", detail: "Masala Crunchies: sometimes-safe", icon: CalendarDays },
  { title: "Food diary", detail: "Poha, dal chawal, samosa, roti sabzi", icon: Utensils }
];

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Activity timeline"
        title="Health history"
        description="Saved scans, diary entries, and report activity appear here as your family uses DabbaDoc."
        icon={CalendarDays}
        stats={[
          { label: "Trend", value: "+16 pts" },
          { label: "Entries", value: "3 recent" },
          { label: "Window", value: "5 days" }
        ]}
      />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Dabba Health Index trend</CardTitle>
        </CardHeader>
        <CardContent>
          <HealthIndexChart data={history} />
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <Card key={row.title} className="glass-panel group">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">{row.title}</p>
                  <p className="text-sm text-muted-foreground">{row.detail}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
