"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export interface MonthPoint {
  month: string; // "6/2026"
  thu: number;
  chi: number;
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
};

export default function CashFlowChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-72 w-full rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="month" tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
          <YAxis tickFormatter={fmtShort} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} width={44} />
          <Tooltip
            formatter={(v) => `${fmt(Number(v))} ₫`}
            contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 12 }}
            labelStyle={{ color: "var(--chart-tooltip-fg)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="thu" name="Thu" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="chi" name="Chi" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
