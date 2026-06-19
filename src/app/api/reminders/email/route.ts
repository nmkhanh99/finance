import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildReminders } from "@/lib/reminders";
import { emailEnabled, sendMail, reminderDigestHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Gửi email nhắc nhở (nợ/mục tiêu đến hạn) cho MỌI user có email — gọi định kỳ bằng cron.
 * VD crontab 07:00 hằng ngày: 0 7 * * * curl -s http://localhost:3000/api/reminders/email
 */
export async function GET() {
  if (!emailEnabled()) {
    return NextResponse.json({ error: "SMTP chưa cấu hình" }, { status: 503 });
  }
  const users = await prisma.user.findMany({
    where: { email: { not: null } },
    select: { id: true, username: true, email: true },
  });
  const now = new Date();
  let sent = 0;
  const errors: string[] = [];
  for (const u of users) {
    const [debts, goals] = await Promise.all([
      prisma.debt.findMany({ where: { userId: u.id }, include: { payments: true } }),
      prisma.goal.findMany({ where: { userId: u.id } }),
    ]);
    const items = buildReminders(debts, goals, now);
    if (items.length === 0) continue;
    try {
      await sendMail({
        to: u.email!,
        subject: `⏰ Nhắc nhở tài chính (${items.length} khoản đến hạn)`,
        html: reminderDigestHtml(items, u.username),
      });
      sent++;
    } catch (e) {
      errors.push(`${u.username}: ${e instanceof Error ? e.message : "lỗi gửi"}`);
    }
  }
  return NextResponse.json({ users: users.length, sent, errors });
}
