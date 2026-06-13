import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  BadgeIndianRupee,
  BrainCircuit,
  CheckCircle2,
  FileScan,
  Flame,
  History,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  Utensils
} from "lucide-react";
import { SectionHeading } from "@/components/common/section-heading";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { icon: FileScan, label: "Receipt intelligence", text: "Reads grocery, food delivery, and quick-commerce bills." },
  { icon: ScanLine, label: "LabelScan truth", text: "Explains sugar, sodium, oils, preservatives, and maida signals." },
  { icon: Utensils, label: "Food diary builder", text: "Turns daily meal entries into wellness insights." },
  { icon: BadgeIndianRupee, label: "Cost comparison", text: "Compares current pattern with healthier Indian swaps." },
  { icon: BrainCircuit, label: "Smart guidance", text: "Combines image reading, nutrition rules, and Indian food context." },
  { icon: ShieldCheck, label: "Privacy first", text: "Your account history stays tied to your verified login." }
];

const steps = [
  "Upload receipt, label, or diary",
  "DabbaDoc extracts food and nutrition signals",
  "Risk scoring highlights what needs attention",
  "Dashboard tracks index, streaks, badges, and reports"
];

const phoneScreens = [
  {
    title: "Food Diary",
    icon: Utensils,
    score: "82",
    accent: "primary",
    rows: ["Masala oats", "Moong chilla", "Masala chai"]
  },
  {
    title: "DabbaBot",
    icon: MessageCircle,
    score: "Tips",
    accent: "secondary",
    rows: ["Add salad with lunch", "Choose medium spice", "Walk after dinner"]
  },
  {
    title: "Streaks",
    icon: Flame,
    score: "15",
    accent: "secondary",
    rows: ["Log meals daily", "Hit 8k steps", "Drink 8 glasses"]
  },
  {
    title: "Badges",
    icon: Award,
    score: "6",
    accent: "primary",
    rows: ["Consistency King", "Label aware", "Fiber fan"]
  },
  {
    title: "History",
    icon: History,
    score: "72",
    accent: "primary",
    rows: ["Receipt scan", "Manual diary", "PDF report"]
  }
];

function MiniPhone({
  screen,
  index
}: {
  screen: (typeof phoneScreens)[number];
  index: number;
}) {
  const Icon = screen.icon;
  const primary = screen.accent === "primary";

  return (
    <div
      className="phone-shell phone-screen-grid h-[340px] w-[190px] shrink-0 p-4 pt-10 sm:h-[390px] sm:w-[218px]"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`grid h-8 w-8 place-items-center rounded-xl border ${
                primary
                  ? "border-primary/25 bg-primary/15 text-primary"
                  : "border-secondary/25 bg-secondary/15 text-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-white">{screen.title}</p>
              <p className="text-[10px] text-muted-foreground">Today</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(129,247,89,0.8)]" />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="mono-label text-[9px] text-muted-foreground">Daily score</p>
              <p className="mt-2 text-4xl font-black text-primary">{screen.score}</p>
            </div>
            <div className="score-arc grid h-16 w-16 place-items-center rounded-full p-1">
              <div className="h-11 w-11 rounded-full bg-[#071018]" />
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div className="h-2 w-4/5 rounded-full bg-primary" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {screen.rows.map((row, rowIndex) => (
            <div
              key={row}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  rowIndex === 1 ? "bg-secondary" : "bg-primary"
                }`}
              />
              <span className="truncate text-xs text-muted-foreground">{row}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto grid grid-cols-4 gap-2 border-t border-white/10 pt-3">
          {[0, 1, 2, 3].map((item) => (
            <span
              key={item}
              className={`mx-auto h-6 w-6 rounded-lg ${
                item === index % 4 ? "bg-primary/20" : "bg-white/5"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative isolate flex min-h-[calc(100svh-8rem)] items-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <Image
            src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1800&q=82"
            alt="Indian meal spread"
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 -z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,10,0.94),rgba(5,9,13,0.78),rgba(5,9,13,0.48))]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-[linear-gradient(0deg,#071018,transparent)]" />

          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div className="page-enter max-w-2xl">
              <div className="mb-6">
                <DabbaDocLogo size="md" />
              </div>
              <Badge variant="secondary">Food intelligence for Indian families</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-normal text-white sm:mt-6 sm:text-6xl lg:text-7xl">
                Eat Smart.
                <span className="block">Track Daily.</span>
                <span className="block text-gradient-premium">Feel Amazing!</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200 sm:mt-6 sm:text-lg sm:leading-7">
                Scan receipts, labels, and daily meals. Get a Dabba Health Index,
                hidden-risk flags, Indian swaps, streaks, badges, and reports in
                one smooth web app.
              </p>

              <div className="mt-7 hidden max-w-xl gap-3 sm:grid sm:grid-cols-2">
                {[
                  { icon: FileScan, title: "Smart tracking", text: "Receipts, labels, meals" },
                  { icon: MessageCircle, title: "DabbaBot guidance", text: "Simple personal tips" },
                  { icon: Flame, title: "Streaks & goals", text: "Build daily habits" },
                  { icon: Award, title: "Rewards", text: "Unlock badges" }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="glass-panel interactive-surface rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-black text-white">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-3 sm:mt-8">
                <Button asChild size="lg">
                  <Link href="/auth">
                    <Sparkles className="h-5 w-5" />
                    Start tracking
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/upload-receipt">
                    <Upload className="h-5 w-5" />
                    Scan receipt
                  </Link>
                </Button>
              </div>
            </div>

            <div className="glass-panel scan-frame mx-auto w-full max-w-sm rounded-2xl p-3 sm:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mono-label text-[10px] text-muted-foreground">Today&apos;s score</p>
                  <p className="mt-1 text-4xl font-black text-primary">72</p>
                </div>
                <div className="score-arc grid h-20 w-20 place-items-center rounded-full p-1.5">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-[#071018]">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {["Scan", "Track", "Improve"].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs font-bold text-white">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden min-w-0 overflow-hidden py-4 md:block">
              <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-4 lg:justify-end">
                {phoneScreens.map((screen, index) => (
                  <div key={screen.title} className="animate-float-soft">
                    <MiniPhone screen={screen} index={index} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="app-section px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
            {["Problem", "Solution", "Progress"].map((title, index) => (
              <Card key={title} className="glass-panel interactive-surface noise-overlay">
                <CardContent className="p-6">
                  <p className="text-sm font-semibold text-primary">{title}</p>
                  <h2 className="mt-3 text-2xl font-bold text-white">
                    {index === 0
                      ? "Food decisions are hidden inside bills."
                      : index === 1
                        ? "DabbaDoc turns scans into practical action."
                        : "Your score improves with everyday swaps."}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {index === 0
                      ? "Sugar, sodium, fried snacks, and low-protein patterns are hard to notice across grocery and order apps."
                      : index === 1
                        ? "The app detects food categories, risk signals, swaps, costs, streaks, badges, and reports."
                        : "The Dabba Health Index gives a simple progress view without medical diagnosis claims."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="app-section px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Features"
            title="One intelligence layer for the Indian kitchen"
            description="Built for grocery receipts, delivery screenshots, nutrition labels, and daily food diaries."
          />
          <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.label} className="glass-panel interactive-surface">
                  <CardContent className="p-6">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-white">{feature.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="app-section px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Badge variant="secondary">How it works</Badge>
              <h2 className="mt-4 text-4xl font-bold text-white">
                From upload to action plan in one guided flow
              </h2>
              <div className="mt-8 space-y-4">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground font-bold">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {["Dabba Health Index", "Food risk map", "Cost delta", "Badges"].map((item, index) => (
                  <div key={item} className="interactive-surface rounded-xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-muted-foreground">{item}</p>
                    <p className="mt-4 text-3xl font-black text-white">
                      {index === 0 ? "72" : index === 1 ? "6" : index === 2 ? "-Rs 520" : "5"}
                    </p>
                    <div className="mt-4 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${68 + index * 6}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="app-section px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Premium Plan"
            title="Unlock unlimited scans, reports, and family tracking"
            description="Premium adds advanced analysis, full history, family health tracking, cost comparisons, and PDF reports."
          />
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
            {["Unlimited uploads", "Advanced insights", "PDF reports", "Family tracking"].map((item) => (
              <span key={item} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="app-section px-4 pb-24 sm:px-6 lg:px-8">
          <div className="glass-panel mx-auto max-w-5xl rounded-2xl border-primary/20 bg-primary/10 p-8 text-center">
            <h2 className="text-3xl font-bold text-white">Start with one receipt today</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              See what is pulling the score down, what to swap, and how your cost
              and health trend may improve.
            </p>
            <Button asChild className="mt-6" size="lg">
              <Link href="/dashboard">
                Open dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
