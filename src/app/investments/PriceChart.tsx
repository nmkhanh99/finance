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

export interface PricePoint {
  t: string; // "19/6 14:30"
  price: number;
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
const fmtShort = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}tỷ`;
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (a >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
};

export default function PriceChart({ data, symbol }: { data: PricePoint[]; symbol: string }) {
  return (
    <div className="h-64 w-full rounded-2xl border border-white/10 bg-white/5 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="t" tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis tickFormatter={fmtShort} tick={{ fill: "#9ca3af", fontSize: 11 }} width={52} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v: number) => [`${fmt(v)} ₫`, symbol]}
            contentStyle={{ background: "#0b0f1a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }}
            labelStyle={{ color: "#e6e9ef" }}
          />
          <Line type="monotone" dataKey="price" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
