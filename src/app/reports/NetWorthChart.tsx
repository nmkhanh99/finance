"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface NetWorthPoint {
  date: string; // "19/6"
  netWorth: number;
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
const fmtShort = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}tỷ`;
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}tr`;
  if (a >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
};

export default function NetWorthChart({ data }: { data: NetWorthPoint[] }) {
  return (
    <div className="h-72 w-full rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="date" tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
          <YAxis tickFormatter={fmtShort} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} width={52} />
          <Tooltip
            formatter={(v) => [`${fmt(Number(v))} ₫`, "Net Worth"]}
            contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 12 }}
            labelStyle={{ color: "var(--chart-tooltip-fg)" }}
          />
          <Line type="monotone" dataKey="netWorth" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
