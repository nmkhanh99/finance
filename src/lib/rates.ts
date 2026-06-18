import { prisma } from "./db";

/** Nạp bảng tỷ giá thành map code -> số VND/1 đơn vị. Dùng với convertToBase. */
export async function loadRates(): Promise<Record<string, number>> {
  const rows = await prisma.exchangeRate.findMany();
  const m: Record<string, number> = {};
  for (const r of rows) m[r.code] = Number(r.rate);
  return m;
}
