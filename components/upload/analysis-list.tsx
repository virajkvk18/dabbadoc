import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  IndianRupee,
  ListChecks,
  ReceiptText,
  ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CostComparison,
  FoodItem,
  RiskFlag,
  SwapRecommendation
} from "@/types";
import { formatCurrency } from "@/lib/utils";

export function DetectedItems({ items }: { items: FoodItem[] }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-primary" />
          Detected food items
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={`${item.name}-${item.category}`}
            className="group rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(129,247,89,0.6)]" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RiskFlags({ risks }: { risks: RiskFlag[] }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-secondary" />
          Risk flags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {risks.map((risk) => (
          <div
            key={risk.label}
            className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-secondary/25 bg-secondary/15 text-secondary">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{risk.label}</p>
                <Badge variant={risk.severity === "high" ? "danger" : "secondary"}>
                  {risk.severity}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{risk.reason}</p>
              <p className="mt-1 text-sm text-orange-100">{risk.possibleConcern}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SwapList({ swaps }: { swaps: SwapRecommendation[] }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          Healthy Indian swaps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {swaps.slice(0, 6).map((swap) => (
          <div
            key={`${swap.original}-${swap.swap}`}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                <span>{swap.original}</span>
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-primary">{swap.swap}</span>
              </p>
              <p className="text-sm text-muted-foreground">{swap.reason}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CostSummary({ cost }: { cost: CostComparison }) {
  return (
    <Card className="glass-panel border-secondary/25">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-secondary" />
          Cost comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mono-label text-[10px] text-muted-foreground">Current monthly</p>
          <p className="mt-1 text-xl font-bold text-white">
            {formatCurrency(cost.currentMonthlyEstimate)}
          </p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
          <p className="mono-label text-[10px] text-muted-foreground">With swaps</p>
          <p className="mt-1 text-xl font-bold text-primary">
            {formatCurrency(cost.healthierMonthlyEstimate)}
          </p>
        </div>
        <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-4">
          <p className="mono-label text-[10px] text-muted-foreground">Monthly change</p>
          <p className="mt-1 flex items-center text-xl font-bold text-orange-200">
            <IndianRupee className="h-4 w-4" />
            {Math.abs(cost.monthlySavings)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
