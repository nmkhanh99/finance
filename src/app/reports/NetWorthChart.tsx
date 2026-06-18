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
    <div className="h-72 w-full rounded-2xl border border-white/10 bg-white/5 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 12 }} />
          <YAxis tickFormatter={fmtShort} tick={{ fill: "#9ca3af", fontSize: 12 }} width={52} />
          <Tooltip
            formatter={(v: number) => [`${fmt(v)} ₫`, "Net Worth"]}
            contentStyle={{ background: "#0b0f1a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }}
            labelStyle={{ color: "#e6e9ef" }}
          />
          <Line type="monotone" dataKey="netWorth" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
