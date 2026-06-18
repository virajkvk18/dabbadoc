"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import {
  APP_TIME_ZONE_LABEL,
  formatAppLongDate,
  formatAppTime,
  getGreetingForDate
} from "@/lib/date-time";
import { cn } from "@/lib/utils";

function useLiveNow(initialNow: string) {
  const [now, setNow] = useState(() => new Date(initialNow));

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return now;
}

export function LiveGreeting({
  name,
  initialNow
}: {
  name: string;
  initialNow: string;
}) {
  const now = useLiveNow(initialNow);

  return (
    <>
      <h1 className="mt-3 text-3xl font-black text-white md:text-4xl" data-testid="live-greeting">
        {getGreetingForDate(now)}, {name}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          {formatAppLongDate(now)}
        </span>
        <time className="inline-flex items-center gap-1.5" dateTime={now.toISOString()} data-testid="live-clock">
          <Clock3 className="h-3.5 w-3.5 text-secondary" />
          {formatAppTime(now, true)} {APP_TIME_ZONE_LABEL}
        </time>
      </div>
    </>
  );
}

export function LiveDateTime({
  initialNow,
  className
}: {
  initialNow: string;
  className?: string;
}) {
  const now = useLiveNow(initialNow);

  return (
    <time
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted-foreground",
        className
      )}
      dateTime={now.toISOString()}
      data-testid="live-date-time"
    >
      <CalendarDays className="h-3.5 w-3.5 text-primary" />
      {formatAppLongDate(now)}
      <span aria-hidden="true">|</span>
      <Clock3 className="h-3.5 w-3.5 text-secondary" />
      {formatAppTime(now, true)} {APP_TIME_ZONE_LABEL}
    </time>
  );
}
