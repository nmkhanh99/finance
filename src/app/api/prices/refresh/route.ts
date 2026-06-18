import { NextResponse } from "next/server";
import { refreshAllPrices } from "@/lib/prices";

export const dynamic = "force-dynamic";

/**
 * Endpoint cập nhật giá (crypto + CK VN) — gọi định kỳ bằng cron (Vercel Cron / crontab gọi curl).
 * VD crontab mỗi 15 phút:  *\/15 * * * *  curl -s http://localhost:3000/api/prices/refresh
 */
export async function GET() {
  const result = await refreshAllPrices();
  const status = result.error ? 502 : 200;
  return NextResponse.json(result, { status });
}
