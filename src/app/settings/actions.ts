"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/currentUser";
import { buildReminders } from "@/lib/reminders";
import { emailEnabled, sendMail, reminderDigestHtml } from "@/lib/email";
import { pushEnabled, sendPush } from "@/lib/push";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateEmail(formData: FormData) {
  const userId = await requireUserId();
  const raw = String(formData.get("email") ?? "").trim();
  if (raw && !EMAIL_RE.test(raw)) redirect("/settings?err=Email không hợp lệ");
  await prisma.user.update({ where: { id: userId }, data: { email: raw || null } });
  revalidatePath("/settings");
  redirect(`/settings?ok=${raw ? "Đã lưu email" : "Đã xoá email"}`);
}

/** Gửi ngay email nhắc cho chính mình (để kiểm tra cấu hình SMTP). */
export async function sendTestReminder() {
  const userId = await requireUserId();
  if (!emailEnabled()) redirect("/settings?err=SMTP chưa cấu hình (đặt SMTP_HOST...)");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, email: true } });
  if (!user?.email) redirect("/settings?err=Bạn chưa đặt email");

  const now = new Date();
  const [debts, goals] = await Promise.all([
    prisma.debt.findMany({ where: { userId }, include: { payments: true } }),
    prisma.goal.findMany({ where: { userId } }),
  ]);
  const items = buildReminders(debts, goals, now);
  try {
    await sendMail({
      to: user.email,
      subject: items.length ? `⏰ Nhắc nhở tài chính (${items.length} khoản)` : "✅ Không có khoản nào đến hạn",
      html: items.length
        ? reminderDigestHtml(items, user.username)
        : `<p>Chào ${user.username}, hiện không có khoản nợ/mục tiêu nào sắp đến hạn. (Email thử nghiệm.)</p>`,
    });
  } catch (e) {
    redirect(`/settings?err=${encodeURIComponent(e instanceof Error ? e.message : "Lỗi gửi email")}`);
  }
  redirect(`/settings?ok=${encodeURIComponent(`Đã gửi tới ${user.email}`)}`);
}

// ----- Web Push (gọi từ client component PushToggle) -----

export async function saveSubscription(sub: { endpoint: string; p256dh: string; auth: string }) {
  const userId = await requireUserId();
  if (!sub?.endpoint || !sub?.p256dh || !sub?.auth) return { ok: false };
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
    update: { userId, p256dh: sub.p256dh, auth: sub.auth },
  });
  return { ok: true };
}

export async function deleteSubscription(endpoint: string) {
  const userId = await requireUserId();
  if (!endpoint) return;
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
}

export async function sendTestPush(): Promise<{ ok: boolean; msg: string }> {
  const userId = await requireUserId();
  if (!pushEnabled()) return { ok: false, msg: "Server chưa cấu hình VAPID." };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { ok: false, msg: "Chưa bật thông báo trên thiết bị này." };
  const payload = { title: "✅ Thông báo thử", body: "Web push đang hoạt động!", url: "/settings" };
  const dead: string[] = [];
  let ok = 0;
  for (const s of subs) {
    const r = await sendPush(s, payload);
    if (r === "ok") ok++;
    else if (r === "gone") dead.push(s.id);
  }
  if (dead.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } });
  return { ok: ok > 0, msg: ok > 0 ? `Đã gửi tới ${ok} thiết bị.` : "Gửi thất bại (kiểm tra VAPID/đăng ký)." };
}
