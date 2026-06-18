import { NextResponse } from "next/server";
import { refreshFxRates } from "@/lib/fxRates";

export const dynamic = "force-dynamic";

/**
 * Cập nhật tỷ giá từ API — gọi định kỳ bằng cron.
 * VD crontab hằng ngày 06:00:  0 6 * * *  curl -s http://localhost:3000/api/rates/refresh
 */
export async function GET() {
  const result = await refreshFxRates();
  const status = result.error ? 502 : 200;
  return NextResponse.json(result, { status });
}
