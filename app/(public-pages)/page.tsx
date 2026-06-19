import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  BadgeIndianRupee,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  FileScan,
  Flame,
  Lightbulb,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  Utensils
} from "lucide-react";
import { ControlledLoopVideo } from "@/components/common/controlled-loop-video";
import { SectionHeading } from "@/components/common/section-heading";
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

const scanRows = [
  {
    name: "Paneer wrap",
    detail: "Protein rich, watch creamy sauces",
    status: "Good",
    tone: "primary"
  },
  {
    name: "Masala chips",
    detail: "High sodium and fried oil signal",
    status: "Swap",
    tone: "secondary"
  },
  {
    name: "Sweet drink",
    detail: "Sugar load may spike quickly",
    status: "Limit",
    tone: "secondary"
  },
  {
    name: "Curd bowl",
    detail: "Better gut-friendly add-on",
    status: "Add",
    tone: "primary"
  }
];

const insightCards = [
  {
    icon: ShieldCheck,
    label: "Risk map",
    value: "3 alerts",
    detail: "Sugar, sodium, fried snack"
  },
  {
    icon: BadgeIndianRupee,
    label: "Better basket",
    value: "Rs 180 saved",
    detail: "Swap chips with roasted makhana"
  },
  {
    icon: CalendarDays,
    label: "History",
    value: "Saved",
    detail: "Receipt, label, and diary in timeline"
  }
];

function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-[720px] lg:ml-auto">
      <div className="absolute -right-8 top-10 hidden h-40 w-40 rounded-full bg-primary/15 blur-3xl md:block" />
      <div className="absolute -bottom-8 left-6 hidden h-44 w-44 rounded-full bg-secondary/15 blur-3xl md:block" />

      <div className="glass-panel scan-frame relative overflow-hidden rounded-2xl p-3 sm:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-label text-muted-foreground">Live food scan</p>
            <p className="mt-2 text-4xl font-black leading-none text-primary">82</p>
            <p className="mt-1 text-xs font-bold text-primary">Good choice</p>
          </div>
          <div className="score-arc grid h-20 w-20 shrink-0 place-items-center rounded-full p-1.5">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#071018]">
              <ScanLine className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {scanRows.slice(0, 2).map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 p-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">{row.detail}</p>
              </div>
              <span
                className={
                  row.tone === "primary"
                    ? "rounded-full bg-primary/15 px-2 py-1 text-[10px] font-black text-primary"
                    : "rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-black text-secondary"
                }
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {["Risk map", "Swaps", "History"].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-xs font-bold text-white"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel scan-frame relative hidden overflow-hidden rounded-3xl p-4 sm:block sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(250px,0.86fr)_1fr] lg:items-center">
          <div className="phone-shell phone-screen-grid mx-auto h-[430px] w-full max-w-[260px] p-4 pt-10 xl:max-w-[280px]">
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-white">Food Scan</p>
                  <p className="text-xs text-muted-foreground">Receipt and label</p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/25 bg-primary/15 text-primary brand-glow">
                  <ScanLine className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-label text-muted-foreground">Dabba score</p>
                    <p className="mt-2 text-5xl font-black leading-none text-primary">
                      82
                    </p>
                    <p className="mt-1 text-xs font-bold text-primary">Good choice</p>
                  </div>
                  <div className="score-arc grid h-20 w-20 place-items-center rounded-full p-1.5">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-[#071018]">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {scanRows.map((row) => (
                  <div
                    key={row.name}
                    className="rounded-xl border border-white/10 bg-black/25 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {row.name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {row.detail}
                        </p>
                      </div>
                      <span
                        className={
                          row.tone === "primary"
                            ? "rounded-full bg-primary/15 px-2 py-1 text-[10px] font-black text-primary"
                            : "rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-black text-secondary"
                        }
                      >
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Add curd or salad today to balance spice and sodium load.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-white">DabbaBot insight</p>
                  <p className="text-xs text-muted-foreground">
                    Practical guidance after every scan
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm leading-6 text-slate-200">
                  Your bill is mostly balanced, but chips and sweet drink can
                  push sodium and sugar up. Swap one snack and add protein at
                  dinner.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {insightCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="interactive-surface flex min-h-[178px] flex-col rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/15 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="mt-3 min-w-0">
                      <p className="text-[10px] font-bold uppercase leading-4 tracking-wide text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 break-words text-base font-black leading-6 text-white">
                        {item.value}
                      </p>
                      <p className="mt-1.5 break-words text-xs leading-5 text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="glass-panel rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">Daily habit loop</p>
                  <p className="text-xs text-muted-foreground">
                    Scan, improve, save history
                  </p>
                </div>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                  15 day streak
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Scan", "Swap", "Track"].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-xs font-bold text-white"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExplainerVideoSection() {
  return (
    <section className="app-section px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
        <div>
          <Badge variant="secondary">Product walkthrough</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-white sm:text-4xl">
            See how DabbaDoc turns food choices into action
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            A quick visual walkthrough of scanning, scoring, risk detection,
            Indian swaps, streaks, history, and reports.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: ScanLine, label: "Scan", text: "Receipts, labels, and meals" },
              { icon: BrainCircuit, label: "Understand", text: "Food risks and nutrition signals" },
              { icon: CheckCircle2, label: "Improve", text: "Swaps, habits, and reports" }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="glass-panel interactive-surface rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-black text-white">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel scan-frame relative overflow-hidden rounded-3xl p-3 sm:p-4">
          <div className="absolute right-6 top-6 z-10 hidden rounded-full border border-primary/20 bg-black/45 px-3 py-1 text-xs font-bold text-primary shadow-[0_0_22px_rgba(129,247,89,0.24)] backdrop-blur-xl sm:inline-flex">
            Label Padhega India
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_28px_70px_rgba(0,0,0,0.38)]">
            <ControlledLoopVideo
              src="/videos/dabbadoc-explainer.mp4"
              ariaLabel="DabbaDoc product walkthrough"
              videoClassName="aspect-video w-full bg-black object-contain"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-[linear-gradient(0deg,rgba(3,7,13,0.75),transparent)]" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {["Receipt intelligence", "Label truth", "Family history"].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-bold text-slate-100"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-secondary/15 blur-3xl" />
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden px-4 py-8 sm:px-5 lg:px-6">
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

          <div className="mx-auto grid w-full max-w-[1800px] gap-6 sm:gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(620px,1.18fr)] lg:items-center xl:gap-12">
            <div className="page-enter max-w-3xl">
              <Badge variant="secondary">Food intelligence for Indian families</Badge>
              <h1 className="mt-4 text-[2.75rem] font-black leading-[0.98] tracking-normal text-white sm:mt-5 sm:text-6xl lg:text-7xl">
                Eat Smart.
                <span className="block">Track Daily.</span>
                <span className="block text-gradient-premium">Feel Amazing!</span>
              </h1>
              <div className="mt-5 max-w-2xl rounded-2xl border border-white/10 bg-black/35 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.24)] backdrop-blur-md sm:p-5">
                <p className="text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                  Scan receipts, labels, and daily meals. Get a Dabba Health
                  Index with hidden-risk flags, Indian food swaps, streaks,
                  badges, and reports built for everyday family food decisions.
                </p>
                <div className="mt-4 hidden grid-cols-3 gap-2 sm:grid">
                  {["Health index", "Risk signals", "Smart swaps"].map((item) => (
                    <span
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-bold text-slate-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 hidden max-w-2xl gap-3 sm:grid sm:grid-cols-2">
                {[
                  { icon: FileScan, title: "Smart tracking", text: "Receipts, labels, meals" },
                  { icon: MessageCircle, title: "DabbaBot guidance", text: "Simple personal tips" },
                  { icon: Flame, title: "Streaks & goals", text: "Build daily habits" },
                  { icon: Award, title: "Rewards", text: "Unlock badges" }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="glass-panel interactive-surface rounded-2xl p-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
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

              <div className="mt-5 grid gap-3 sm:mt-6 sm:flex sm:flex-wrap">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/auth">
                    <Sparkles className="h-5 w-5" />
                    Start tracking
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Link href="/dashboard/upload-receipt">
                    <Upload className="h-5 w-5" />
                    Scan receipt
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/about">
                    <ShieldCheck className="h-5 w-5" />
                    About DabbaDoc
                  </Link>
                </Button>
              </div>
            </div>

            <HeroShowcase />

            <Link
              href="#food-decisions"
              aria-label="Scroll to explore DabbaDoc"
              className="group mx-auto flex w-fit flex-col items-center gap-2 text-primary transition hover:text-white sm:hidden"
            >
              <span className="relative grid h-12 w-12 place-items-center rounded-full border border-primary/30 bg-black/35 shadow-[0_0_24px_rgba(129,247,89,0.22)] backdrop-blur-xl">
                <span className="absolute inset-0 rounded-full border border-primary/20 opacity-70 motion-safe:animate-ping" />
                <ChevronDown className="relative h-5 w-5 motion-safe:animate-bounce" />
              </span>
            </Link>
          </div>

          <Link
            href="#food-decisions"
            aria-label="Scroll to explore DabbaDoc"
            className="group absolute left-1/2 top-[calc(100svh-9rem)] z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-primary transition hover:text-white sm:flex"
          >
            <span className="text-label text-slate-200/80 transition group-hover:text-white">
              Explore
            </span>
            <span className="relative grid h-14 w-14 place-items-center rounded-full border border-primary/30 bg-black/35 shadow-[0_0_28px_rgba(129,247,89,0.24)] backdrop-blur-xl transition group-hover:border-primary/60 group-hover:bg-primary/15 group-hover:shadow-[0_0_40px_rgba(129,247,89,0.36)]">
              <span className="absolute inset-0 rounded-full border border-primary/20 opacity-70 motion-safe:animate-ping" />
              <span className="absolute h-8 w-8 rounded-full bg-primary/10 blur-md transition group-hover:bg-primary/20" />
              <ChevronDown className="relative h-6 w-6 motion-safe:animate-bounce" />
            </span>
          </Link>
        </section>

        <section id="food-decisions" className="app-section scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
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

        <ExplainerVideoSection />

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
