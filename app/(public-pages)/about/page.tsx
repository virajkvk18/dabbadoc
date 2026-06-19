import Link from "next/link";
import {
  BadgeIndianRupee,
  Bot,
  CheckCircle2,
  FileScan,
  HeartPulse,
  History,
  ScanLine,
  ShieldCheck,
  Utensils
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    icon: FileScan,
    title: "Receipt scan",
    text: "Upload grocery, restaurant, delivery, or quick-commerce bills. DabbaDoc detects food items and builds a simple health view."
  },
  {
    icon: ScanLine,
    title: "LabelScan",
    text: "Scan packaged-food labels to understand sugar, sodium, oils, maida, preservatives, and nutrition signals."
  },
  {
    icon: Utensils,
    title: "Food diary",
    text: "Log daily meals in a simple way and track patterns across home food, outside food, cravings, and goals."
  },
  {
    icon: Bot,
    title: "DabbaBot",
    text: "Ask food-history questions and get practical food suggestions based on saved scans and diary activity."
  },
  {
    icon: BadgeIndianRupee,
    title: "Budget + health",
    text: "Compare choices with healthier Indian swaps and understand how small food changes can affect monthly spending."
  },
  {
    icon: History,
    title: "History and reports",
    text: "Keep scans, summaries, streaks, badges, and monthly patterns in one dashboard for easier follow-up."
  }
];

const values = [
  "Built for Indian foods, labels, receipts, and family eating patterns.",
  "Explains food signals in simple language, not medical jargon.",
  "Supports goals like weight loss, high protein, low sodium, diabetes-friendly eating, and family tracking.",
  "Keeps insights general wellness focused. It does not diagnose disease."
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden px-4 py-14 sm:px-5 sm:py-18 lg:px-6">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(129,247,89,0.16),transparent_34%),linear-gradient(180deg,rgba(7,16,24,0.2),rgba(7,16,24,0.85))]" />
          <div className="mx-auto grid w-full max-w-[1800px] gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.58fr)] lg:items-center">
            <div className="max-w-4xl">
              <Badge variant="secondary">About DabbaDoc</Badge>
              <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-6xl">
                Food decisions made clearer before you eat.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                DabbaDoc helps users scan receipts, packaged-food labels, barcodes,
                and daily meals to understand food patterns, hidden risk signals,
                smarter Indian swaps, and progress over time.
              </p>
              <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/dashboard/upload-receipt">
                    <FileScan className="h-5 w-5" />
                    Try a scan
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/pricing">
                    View plans
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-primary" />
                  What users get
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {values.map((value) => (
                  <div key={value} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-6 text-muted-foreground">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="app-section px-4 py-14 sm:px-5 lg:px-6">
          <div className="mx-auto w-full max-w-[1800px]">
            <div className="max-w-3xl">
              <p className="mono-label text-primary">Core features</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                One dashboard for scans, diary, reports, and food history.
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pillars.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="glass-panel interactive-surface">
                    <CardContent className="p-5">
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-5 text-lg font-black text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="app-section px-4 pb-20 sm:px-5 lg:px-6">
          <div className="glass-panel mx-auto grid w-full max-w-[1800px] gap-6 rounded-2xl border-primary/20 bg-primary/10 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-black text-white">Important wellness note</h2>
              </div>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
                DabbaDoc gives general food and wellness guidance. It is not a
                medical diagnosis tool. For diabetes, pregnancy, blood pressure,
                allergies, or clinical conditions, users should consult a doctor
                or qualified dietitian before making major diet changes.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/auth">Login/Signup</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
