import { prisma } from "./db";
import { Prisma } from "@prisma/client";

export interface FxRefreshResult {
  updated: number;
  skipped: string[]; // mã không có trong API
  error?: string;
}

/**
 * Cập nhật tỷ giá (VND/1 đơn vị) cho mọi mã đang có (trừ VND) từ open.er-api.com.
 * VND per 1 C = rates.VND / rates[C]. Không ném lỗi (offline -> trả error).
 */
export async function refreshFxRates(): Promise<FxRefreshResult> {
  const codes = (
    await prisma.exchangeRate.findMany({ where: { code: { not: "VND" } }, select: { code: true } })
  ).map((r) => r.code);
  if (codes.length === 0) return { updated: 0, skipped: [] };

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const vndPerUsd = data.rates?.VND;
    if (data.result !== "success" || !vndPerUsd) throw new Error("FX response invalid");

    const skipped: string[] = [];
    let updated = 0;
    for (const code of codes) {
      const perUsd = data.rates?.[code];
      if (!perUsd) {
        skipped.push(code);
        continue;
      }
      const vndPerUnit = vndPerUsd / perUsd;
      await prisma.exchangeRate.update({
        where: { code },
        data: { rate: new Prisma.Decimal(vndPerUnit.toFixed(6)) },
      });
      updated++;
    }
    return { updated, skipped };
  } catch (e) {
    return { updated: 0, skipped: [], error: e instanceof Error ? e.message : "fetch failed" };
  }
}
