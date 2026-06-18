import { NextResponse } from "next/server";
import { recordNetWorthSnapshot } from "@/lib/networth";

export const dynamic = "force-dynamic";

/**
 * Ghi snapshot Net Worth — gọi định kỳ bằng cron để xây lịch sử.
 * VD crontab hằng ngày 23:00:  0 23 * * *  curl -s http://localhost:3000/api/networth/snapshot
 */
export async function GET() {
  const b = await recordNetWorthSnapshot();
  return NextResponse.json(b);
}
