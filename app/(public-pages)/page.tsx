"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeIndianRupee,
  BrainCircuit,
  CheckCircle2,
  FileScan,
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
  { icon: Utensils, label: "Food diary builder", text: "Turns Hinglish meal notes into daily wellness insights." },
  { icon: BadgeIndianRupee, label: "Cost comparison", text: "Compares current pattern with healthier Indian swaps." },
  { icon: BrainCircuit, label: "Smart scan workflow", text: "Combines image reading, nutrition rules, and Indian food context." },
  { icon: ShieldCheck, label: "Safe wording", text: "General wellness insight with clear non-diagnosis boundaries." }
];

const steps = [
  "Upload receipt, label, or diary",
  "DabbaDoc extracts food and nutrition signals",
  "Risk scoring highlights what needs attention",
  "Dashboard tracks index, streaks, badges, and reports"
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative isolate flex min-h-[86vh] items-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          <Image
            src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1800&q=85"
            alt="Indian meal spread"
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 -z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.86),rgba(5,7,10,0.72),rgba(5,7,10,0.35))]" />
          <div className="mx-auto w-full max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl"
            >
              <div className="scan-frame relative mb-8 flex h-44 w-44 items-center justify-center overflow-hidden rounded-[2rem] border border-primary/20 bg-black/25 shadow-[0_0_56px_rgba(129,247,89,0.18)] backdrop-blur-md">
                <DabbaDocLogo size="hero" showText={false} />
                <span className="scan-line" />
              </div>
              <Badge variant="secondary">Scan Before You Eat</Badge>
              <h1 className="mt-6 text-5xl font-black tracking-normal text-white sm:text-6xl lg:text-7xl">
                Dabba<span className="text-primary">Doc</span>
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-100">
                Scan Before You Eat
              </p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Upload bills, order screenshots, packaged labels, or a daily food
                diary. DabbaDoc turns everyday eating into a clear Dabba Health
                Index, swaps, cost impact, and a 7-day action plan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard/upload-receipt">
                    <Sparkles className="h-5 w-5" />
                    Try Demo Analysis
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/upload-receipt">
                    <Upload className="h-5 w-5" />
                    Upload Receipt
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
            {["Problem", "Solution", "Dashboard preview"].map((title, index) => (
              <Card key={title} className="glass-panel noise-overlay">
                <CardContent className="p-6">
                  <p className="text-sm font-semibold text-primary">{title}</p>
                  <h2 className="mt-3 text-2xl font-bold text-white">
                    {index === 0
                      ? "Family food decisions are hidden inside bills."
                      : index === 1
                        ? "DabbaDoc explains patterns in simple Hinglish."
                        : "A score that gets better with everyday swaps."}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {index === 0
                      ? "Packaged snacks, sugar, sodium, and fried food are hard to track across grocery and order apps."
                      : index === 1
                        ? "Smart analysis detects food categories, risk signals, swaps, costs, streaks, badges, and reports."
                        : "The Dabba Health Index shows movement over time without making diagnosis claims."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Features"
            title="One health-intelligence layer for the Indian kitchen"
            description="Built for grocery receipts, delivery screenshots, nutrition labels, and Hinglish daily diaries."
          />
          <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.label} className="glass-panel">
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

        <section className="px-4 py-20 sm:px-6 lg:px-8">
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
                {["Dabba Health Index", "Food Blame Map", "Cost delta", "Badges"].map((item, index) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-5">
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

        <section className="px-4 py-20 sm:px-6 lg:px-8">
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

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
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
