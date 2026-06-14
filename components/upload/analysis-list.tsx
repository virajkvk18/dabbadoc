import {
  AlertTriangle,
  ArrowRight,
  BadgeInfo,
  ClipboardList,
  CheckCircle2,
  FileText,
  FlaskConical,
  HeartPulse,
  IndianRupee,
  ListChecks,
  ReceiptText,
  ScanSearch,
  ShieldAlert,
  TimerReset
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CostComparison,
  FoodItem,
  FutureHealthRisk,
  IngredientInsight,
  ItemHealthInsight,
  LabelCoverageSummary,
  NutritionFact,
  ReceiptCoverageSummary,
  RiskFlag,
  SwapRecommendation
} from "@/types";
import { formatCurrency } from "@/lib/utils";

export function ExtractedReceiptText({
  text,
  title = "Extracted receipt text"
}: {
  text: string;
  title?: string;
}) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-muted-foreground">
          {text || "No readable text was extracted from this upload."}
        </pre>
      </CardContent>
    </Card>
  );
}

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
        {items.length === 0 ? (
          <p className="sm:col-span-2 text-sm text-muted-foreground">
            No food items were confidently detected. Check the extracted text and
            try a sharper, cropped image if important items are missing.
          </p>
        ) : null}
        {items.map((item) => (
          <div
            key={`${item.name}-${item.category}`}
            className="group rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[item.category, item.quantity, item.price ? formatCurrency(item.price) : null]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              </div>
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(129,247,89,0.6)]" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReceiptCoverage({ coverage }: { coverage?: ReceiptCoverageSummary }) {
  if (!coverage) return null;

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanSearch className="h-5 w-5 text-primary" />
          Detection coverage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Items found", value: coverage.detectedCount },
            { label: "Need attention", value: coverage.riskyCount },
            { label: "Swaps ready", value: coverage.swappedCount }
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mono-label text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>
        <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-muted-foreground">
          {coverage.confidenceNote}
        </p>
      </CardContent>
    </Card>
  );
}

export function LabelCoverage({ coverage }: { coverage?: LabelCoverageSummary }) {
  if (!coverage) return null;

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanSearch className="h-5 w-5 text-primary" />
          Label detection coverage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Nutrition facts", value: coverage.nutritionFactCount },
            { label: "Ingredients", value: coverage.ingredientCount },
            { label: "Additives/signals", value: coverage.additiveCount }
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mono-label text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>
        <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-muted-foreground">
          {coverage.confidenceNote}
        </p>
      </CardContent>
    </Card>
  );
}

function concernVariant(concern: NutritionFact["concernLevel"] | IngredientInsight["concernLevel"]) {
  if (concern === "high") return "danger";
  if (concern === "medium") return "secondary";
  if (concern === "low") return "default";
  return "outline";
}

export function NutritionFacts({ facts }: { facts?: NutritionFact[] }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Nutrition facts explained
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {!facts?.length ? (
          <p className="lg:col-span-2 text-sm text-muted-foreground">
            Nutrition table was not clearly detected. Capture the nutrition panel straight,
            close, and in good light for calorie, sugar, sodium, fat, protein, and fiber details.
          </p>
        ) : null}
        {facts?.map((fact) => (
          <div
            key={`${fact.label}-${fact.value}-${fact.unit}`}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{fact.label}</p>
                <p className="text-sm text-muted-foreground">
                  {typeof fact.value === "number"
                    ? `${fact.value}${fact.unit ? ` ${fact.unit}` : ""}`
                    : fact.raw || "Detected"}{" "}
                  {fact.per ? `(${fact.per})` : ""}
                </p>
              </div>
              <Badge variant={concernVariant(fact.concernLevel)}>
                {fact.concernLevel}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {fact.interpretation}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function IngredientInsightList({
  insights
}: {
  insights?: IngredientInsight[];
}) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Ingredients explained
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {!insights?.length ? (
          <p className="lg:col-span-2 text-sm text-muted-foreground">
            Ingredients list was not clearly detected. Try a closer image of the
            ingredients panel.
          </p>
        ) : null}
        {insights?.map((insight) => (
          <div
            key={insight.ingredient}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold text-white">{insight.ingredient}</p>
              <Badge variant={concernVariant(insight.concernLevel)}>
                {insight.concernLevel}
              </Badge>
            </div>
            <div className="mt-3 space-y-3">
              <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-white">Why added: </span>
                {insight.purposeInFood}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {insight.simpleHinglishExplanation}
              </p>
              {insight.possibleRegularUseConcern ? (
                <p className="rounded-xl border border-secondary/25 bg-secondary/10 p-3 text-sm leading-6 text-orange-100">
                  <BadgeInfo className="mr-2 inline h-4 w-4" />
                  {insight.possibleRegularUseConcern}
                </p>
              ) : null}
              {insight.naturalOrBetterAlternative ? (
                <p className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                  Better option: {insight.naturalOrBetterAlternative}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function verdictLabel(verdict: ItemHealthInsight["verdict"]) {
  if (verdict === "good_choice") return "Good";
  if (verdict === "watch_portion") return "Watch";
  if (verdict === "risky_if_frequent") return "Risky if frequent";
  return "Needs label check";
}

export function ItemInsightList({ insights }: { insights?: ItemHealthInsight[] }) {
  if (!insights?.length) return null;

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          Item-by-item health read
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {insights.map((insight, index) => (
          <div
            key={`${insight.item}-${index}`}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{insight.item}</p>
              <Badge
                variant={
                  insight.verdict === "risky_if_frequent"
                    ? "danger"
                    : insight.verdict === "good_choice"
                      ? "default"
                      : "secondary"
                }
              >
                {verdictLabel(insight.verdict)}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {insight.reason}
            </p>
            {insight.linkedRisks.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {insight.linkedRisks.slice(0, 3).map((risk) => (
                  <Badge key={risk} variant="outline">{risk}</Badge>
                ))}
              </div>
            ) : null}
            {insight.swap ? (
              <p className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                Better swap: {insight.swap}
              </p>
            ) : null}
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
        {risks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No strong risk flags were detected from this scan.
          </p>
        ) : null}
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

export function FutureHealthRisks({ risks }: { risks?: FutureHealthRisk[] }) {
  if (!risks?.length) return null;

  return (
    <Card className="glass-panel border-secondary/25">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TimerReset className="h-5 w-5 text-secondary" />
          If this becomes frequent
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {risks.map((risk, index) => (
          <div
            key={`${risk.riskArea}-${index}`}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-white">{risk.riskArea}</p>
              <Badge variant={risk.severity === "high" ? "danger" : "secondary"}>
                {risk.severity}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-orange-100">
              {risk.habitFrequency}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {risk.possibleConcern}
            </p>
            {risk.timeframe ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {risk.timeframe}
              </p>
            ) : null}
            {risk.linkedItems.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {risk.linkedItems.map((item) => (
                  <Badge key={item} variant="outline">{item}</Badge>
                ))}
              </div>
            ) : null}
            <p className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
              {risk.preventionTip}
            </p>
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
        {swaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No specific swap was needed from the detected items. Keep portions balanced
            and add protein/fiber where possible.
          </p>
        ) : null}
        {swaps.map((swap) => (
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
