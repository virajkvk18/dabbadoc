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
    <div className="h-64 w-full rounded-xl border border-white/10 bg-black/20 p-1 sm:h-72 sm:p-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 16, bottom: 0 }}>
          <defs>
            <linearGradient id="score" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#81f759" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#81f759" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 600 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={38}
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.46)", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: "#071018",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              color: "white",
              fontSize: 12,
              boxShadow: "0 16px 36px rgba(0,0,0,0.35)"
            }}
            cursor={{ stroke: "rgba(129,247,89,0.24)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#81f759"
            strokeWidth={3}
            fill="url(#score)"
            activeDot={{ r: 5, fill: "#81f759", stroke: "#071018", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
