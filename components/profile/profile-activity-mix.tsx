"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  ReceiptText,
  ScanLine,
  Utensils
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileActivityMixProps = {
  receipts: number;
  labels: number;
  diaries: number;
  reports: number;
};

export function ProfileActivityMix({
  receipts,
  labels,
  diaries,
  reports
}: ProfileActivityMixProps) {
  const reduceMotion = useReducedMotion();
  const items = [
    { label: "Receipt scans", value: receipts, icon: ReceiptText, bar: "bg-secondary", iconStyle: "bg-secondary/15 text-secondary" },
    { label: "Label checks", value: labels, icon: ScanLine, bar: "bg-primary", iconStyle: "bg-primary/15 text-primary" },
    { label: "Diary entries", value: diaries, icon: Utensils, bar: "bg-sky-300", iconStyle: "bg-sky-300/10 text-sky-200" },
    { label: "PDF reports", value: reports, icon: FileText, bar: "bg-white/70", iconStyle: "bg-white/10 text-white" }
  ];
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="glass-panel h-full overflow-hidden">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Activity mix</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">How your saved profile history is growing</p>
        </div>
        <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-white">
          {total}
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        {items.map((item, index) => {
          const Icon = item.icon;
          const percentage = total > 0 ? Math.max(6, (item.value / total) * 100) : 0;

          return (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 text-sm font-semibold text-white">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${item.iconStyle}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </span>
                <span className="text-sm font-black text-white">{item.value}</span>
              </div>
              <div className="ml-12 h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className={`h-full rounded-full ${item.bar}`}
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.75, delay: 0.08 * index, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}

        {total === 0 ? (
          <p className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
            Your activity mix will appear after your first saved scan or diary entry.
          </p>
        ) : null}

        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href="/dashboard/history">
            Explore complete history
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
