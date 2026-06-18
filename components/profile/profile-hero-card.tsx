"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Flame,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ProfileHeroCardProps = {
  fullName: string;
  email: string;
  initials: string;
  planLabel: string;
  isPremium: boolean;
  memberSince: string;
  score: number;
  scoreCategory: string;
  streakDays: number;
  savedActivities: number;
  badges: number;
  reports: number;
};

function getNextStreakMilestone(days: number) {
  return [3, 7, 14, 30, 60, 100].find((milestone) => milestone > days) ??
    Math.ceil((days + 1) / 50) * 50;
}

export function ProfileHeroCard({
  fullName,
  email,
  initials,
  planLabel,
  isPremium,
  memberSince,
  score,
  scoreCategory,
  streakDays,
  savedActivities,
  badges,
  reports
}: ProfileHeroCardProps) {
  const reduceMotion = useReducedMotion();
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const safeStreak = Math.max(0, streakDays);
  const nextMilestone = getNextStreakMilestone(safeStreak);
  const streakProgress = Math.min(100, (safeStreak / nextMilestone) * 100);

  return (
    <Card className="glass-panel scan-frame neon-bloom-primary overflow-hidden border-primary/25">
      <CardContent className="p-0">
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_390px] lg:items-center">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <motion.div
              className="relative grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-primary/40 bg-primary/15 text-3xl font-black text-primary shadow-[0_0_32px_rgba(129,247,89,0.22)]"
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                className="absolute inset-2 rounded-xl border border-primary/25"
                animate={reduceMotion ? undefined : { opacity: [0.3, 0.85, 0.3] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative">{initials}</span>
              <span className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-lg border border-background bg-primary text-primary-foreground shadow-lg">
                <BadgeCheck className="h-4 w-4" />
              </span>
            </motion.div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified account
                </Badge>
                <Badge variant={isPremium ? "secondary" : "outline"}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {planLabel}
                </Badge>
              </div>
              <h1 className="mt-3 break-words text-3xl font-black text-white sm:text-4xl">
                {fullName}
              </h1>
              <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
                <span className="flex min-w-0 items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{email}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-secondary" />
                  Member since {memberSince}
                </span>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    Account settings
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pricing">
                    Manage plan
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="mono-label text-[10px] text-muted-foreground">Health score</p>
                <span className="text-xs font-bold text-primary">{scoreCategory}</span>
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-black leading-none text-white">{safeScore}</span>
                <span className="pb-1 text-xs font-bold text-muted-foreground">/100</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-primary shadow-[0_0_14px_rgba(129,247,89,0.5)]"
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${safeScore}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="mono-label text-[10px] text-muted-foreground">Active streak</p>
                <Flame className="h-4 w-4 text-secondary" fill="currentColor" />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-black leading-none text-white">{safeStreak}</span>
                <span className="pb-1 text-xs font-bold text-muted-foreground">days</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-secondary shadow-[0_0_14px_rgba(253,139,0,0.45)]"
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${streakProgress}%` }}
                  transition={{ duration: 0.9, delay: 0.12, ease: "easeOut" }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Next milestone: {nextMilestone} days
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-white/10 bg-black/10">
          {[
            { label: "Saved activity", value: savedActivities },
            { label: "Badges", value: badges },
            { label: "Reports", value: reports }
          ].map((item, index) => (
            <div
              key={item.label}
              className={`px-3 py-4 text-center sm:px-5 ${index > 0 ? "border-l border-white/10" : ""}`}
            >
              <p className="text-xl font-black text-white sm:text-2xl">{item.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
