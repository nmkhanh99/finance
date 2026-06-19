import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordNetWorthSnapshot } from "@/lib/networth";

export const dynamic = "force-dynamic";

/**
 * Ghi snapshot Net Worth cho MỌI user — gọi định kỳ bằng cron để xây lịch sử.
 * VD crontab hằng ngày 23:00:  0 23 * * *  curl -s http://localhost:3000/api/networth/snapshot
 */
export async function GET() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) await recordNetWorthSnapshot(u.id);
  return NextResponse.json({ users: users.length });
}
