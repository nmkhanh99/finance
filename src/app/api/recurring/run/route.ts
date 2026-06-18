import { NextResponse } from "next/server";
import { runDueRecurring } from "@/lib/recurringRun";

export const dynamic = "force-dynamic";

/**
 * Sinh giao dịch định kỳ tới hạn — gọi định kỳ bằng cron.
 * VD crontab hằng ngày 00:05:  5 0 * * *  curl -s http://localhost:3000/api/recurring/run
 */
export async function GET() {
  const r = await runDueRecurring();
  return NextResponse.json(r);
}
