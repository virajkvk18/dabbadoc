"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function HealthIndexChart({
  data
}: {
  data: Array<{ date: string; score: number }>;
}) {
  return (
    <div className="h-72 w-full rounded-2xl border border-white/10 bg-black/20 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 10, top: 16, bottom: 0 }}>
          <defs>
            <linearGradient id="score" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#81f759" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#81f759" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.55)" tickLine={false} />
          <YAxis stroke="rgba(255,255,255,0.55)" tickLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: "#071018",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "white"
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#81f759"
            strokeWidth={3}
            fill="url(#score)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
