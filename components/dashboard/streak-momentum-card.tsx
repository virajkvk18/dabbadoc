"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Flame,
  Trophy,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StreakDay = {
  label: string;
  dateLabel: string;
  active: boolean;
  today: boolean;
};

interface StreakMomentumCardProps {
  days: number;
  week: StreakDay[];
  className?: string;
}

function getNextMilestone(days: number) {
  const milestones = [3, 7, 14, 30, 60, 100];
  return milestones.find((milestone) => milestone > days) ?? Math.ceil((days + 1) / 50) * 50;
}

export function StreakMomentumCard({
  days,
  week,
  className
}: StreakMomentumCardProps) {
  const reduceMotion = useReducedMotion();
  const safeDays = Math.max(0, days);
  const nextMilestone = getNextMilestone(safeDays);
  const previousMilestone = [0, 3, 7, 14, 30, 60, 100]
    .filter((milestone) => milestone <= safeDays)
    .at(-1) ?? 0;
  const milestoneRange = Math.max(1, nextMilestone - previousMilestone);
  const milestoneProgress = Math.min(
    100,
    Math.max(0, ((safeDays - previousMilestone) / milestoneRange) * 100)
  );
  const daysRemaining = Math.max(0, nextMilestone - safeDays);
  const activeThisWeek = week.filter((day) => day.active).length;
  const status = safeDays === 0 ? "Start today" : safeDays < 7 ? "Building rhythm" : "Strong momentum";

  return (
    <Card
      className={cn(
        "glass-panel relative h-full overflow-hidden border-secondary/30",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary/70" />
      <CardContent className="relative flex h-full flex-col justify-between gap-6 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              className="relative grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-secondary/35 bg-secondary/15 text-secondary shadow-[0_0_28px_rgba(253,139,0,0.2)]"
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -3, 0], rotate: [0, -2, 2, 0], scale: [1, 1.04, 1] }
              }
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                className="absolute inset-1 rounded-lg border border-secondary/25"
                animate={reduceMotion ? undefined : { opacity: [0.25, 0.8, 0.25] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <Flame className="relative h-7 w-7" fill="currentColor" />
            </motion.div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="mono-label text-[10px] text-muted-foreground">Daily streak</p>
                <Badge variant="outline" className="border-secondary/35 text-secondary">
                  <Zap className="h-3 w-3" />
                  {status}
                </Badge>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <motion.span
                  className="text-5xl font-black leading-none text-white"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  {safeDays}
                </motion.span>
                <span className="pb-1 text-sm font-bold text-muted-foreground">
                  {safeDays === 1 ? "day" : "days"}
                </span>
              </div>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {safeDays === 0
                  ? "Log one meal today to begin your consistency streak."
                  : `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} to unlock your ${nextMilestone}-day milestone.`}
              </p>
            </div>
          </div>

          <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
            <Link href="/dashboard/food-diary">
              Log today
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-end">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 font-semibold text-white">
                <Trophy className="h-4 w-4 text-secondary" />
                Next milestone
              </span>
              <span className="font-bold text-secondary">{nextMilestone} days</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-white/5"
              role="progressbar"
              aria-label={`Progress to ${nextMilestone} day streak`}
              aria-valuemin={previousMilestone}
              aria-valuemax={nextMilestone}
              aria-valuenow={safeDays}
            >
              <motion.div
                className="h-full rounded-full bg-secondary shadow-[0_0_16px_rgba(253,139,0,0.55)]"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${milestoneProgress}%` }}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold text-white">
                <CalendarCheck2 className="h-4 w-4 text-primary" />
                Last 7 days
              </span>
              <span className="text-muted-foreground">{activeThisWeek}/7 active</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5" aria-label="Seven day activity rhythm">
              {week.map((day, index) => (
                <motion.div
                  key={`${day.dateLabel}-${index}`}
                  className="text-center"
                  title={`${day.dateLabel}: ${day.active ? "activity saved" : "no saved activity"}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.18 + index * 0.05 }}
                >
                  <span className="mb-1 block text-[9px] font-bold uppercase text-muted-foreground">
                    {day.label}
                  </span>
                  <span
                    className={cn(
                      "mx-auto grid h-7 w-7 place-items-center rounded-lg border text-[10px] font-black transition-colors",
                      day.active
                        ? "border-primary/50 bg-primary text-primary-foreground shadow-[0_0_12px_rgba(129,247,89,0.28)]"
                        : "border-white/10 bg-white/5 text-muted-foreground",
                      day.today && !day.active ? "border-secondary/50 text-secondary" : ""
                    )}
                  >
                    {day.active ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : day.today ? (
                      <span aria-hidden="true">&middot;</span>
                    ) : null}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
