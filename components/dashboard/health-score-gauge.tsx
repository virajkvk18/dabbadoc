"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HealthScoreGaugeProps {
  score: number;
  category?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  fillHeight?: boolean;
  className?: string;
}

export function HealthScoreGauge({
  score,
  category,
  size = "lg",
  showLabel = true,
  fillHeight = false,
  className
}: HealthScoreGaugeProps) {
  const [mounted, setMounted] = useState(false);
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  useEffect(() => {
    const timeout = window.setTimeout(() => setMounted(true), 100);
    return () => window.clearTimeout(timeout);
  }, []);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const fill = mounted ? (safeScore / 100) * circumference : 0;

  const color =
    safeScore >= 80
      ? "hsl(var(--primary))"
      : safeScore >= 50
        ? "hsl(var(--secondary))"
        : "hsl(var(--destructive))";
  const glowColor =
    safeScore >= 80
      ? "rgba(129,247,89,0.45)"
      : safeScore >= 50
        ? "rgba(253,139,0,0.42)"
        : "rgba(255,180,171,0.42)";

  const label =
    category ??
    (safeScore >= 80
      ? "Great"
      : safeScore >= 60
        ? "Good"
        : safeScore >= 40
          ? "Fair"
          : "Poor");

  const dims = {
    sm: "h-24 w-24",
    md: "h-36 w-36",
    lg: "h-48 w-48"
  }[size];

  return (
    <Card className={cn("glass-panel neon-bloom-primary overflow-hidden", className)}>
      <CardContent
        className={cn(
          "p-6",
          fillHeight && "flex h-full items-center justify-center"
        )}
      >
        <div className="flex flex-col items-center text-center">
          <p className="mono-label mb-4 text-muted-foreground">
            Dabba Health Index
          </p>
          <svg
            viewBox="0 0 128 128"
            className={cn(dims, "drop-shadow-[0_0_18px_rgba(129,247,89,0.16)]")}
            role="img"
            aria-label={`Dabba Health Index score ${safeScore} out of 100`}
          >
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={`${fill} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 64 64)"
              style={{
                filter: `drop-shadow(0 0 8px ${glowColor})`,
                transition:
                  "stroke-dasharray 1s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.5s ease"
              }}
            />
            <circle cx="64" cy="64" r="38" fill="rgba(7,16,24,0.92)" />
            <text
              x="64"
              y="58"
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontFamily="Plus Jakarta Sans Variable, Inter, sans-serif"
              fontSize="26"
              fontWeight="800"
              letterSpacing="0"
            >
              {safeScore}
            </text>
            <text
              x="64"
              y="78"
              textAnchor="middle"
              dominantBaseline="central"
              fill="hsl(var(--muted-foreground))"
              fontFamily="Plus Jakarta Sans Variable, Inter, sans-serif"
              fontSize="9"
              fontWeight="600"
              letterSpacing="0"
            >
              /100
            </text>
          </svg>
          {showLabel ? (
            <span
              className="mt-5 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                background: `${color}22`,
                border: `1px solid ${color}44`,
                color
              }}
            >
              {label}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
