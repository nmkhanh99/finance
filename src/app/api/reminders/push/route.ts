import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildReminders } from "@/lib/reminders";
import { pushEnabled, sendPush, reminderPushPayload } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Gửi Web Push nhắc nhở (nợ/mục tiêu đến hạn) cho mọi user có đăng ký push — gọi bằng cron.
 * Tự xoá các subscription đã hết hạn (404/410).
 */
export async function GET() {
  if (!pushEnabled()) return NextResponse.json({ error: "Push chưa cấu hình" }, { status: 503 });

  const users = await prisma.user.findMany({ where: { pushSubs: { some: {} } }, select: { id: true } });
  const now = new Date();
  let sent = 0;
  const dead: string[] = [];

  for (const u of users) {
    const [debts, goals, subs] = await Promise.all([
      prisma.debt.findMany({ where: { userId: u.id }, include: { payments: true } }),
      prisma.goal.findMany({ where: { userId: u.id } }),
      prisma.pushSubscription.findMany({ where: { userId: u.id } }),
    ]);
    const items = buildReminders(debts, goals, now);
    if (items.length === 0) continue;
    const payload = reminderPushPayload(items);
    for (const s of subs) {
      const r = await sendPush(s, payload);
      if (r === "ok") sent++;
      else if (r === "gone") dead.push(s.id);
    }
  }
  if (dead.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } });
  return NextResponse.json({ users: users.length, sent, pruned: dead.length });
}
