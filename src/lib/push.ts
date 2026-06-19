import "server-only";
import webpush from "web-push";
import type { ReminderItem } from "./reminders";

/** Push bật khi đã có cặp khoá VAPID. */
export function pushEnabled(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function vapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@localhost",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Gửi 1 push. Trả 'ok' | 'gone' (subscription hết hạn -> nên xoá) | 'error'. */
export async function sendPush(t: PushTarget, payload: PushPayload): Promise<"ok" | "gone" | "error"> {
  if (!pushEnabled()) return "error";
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
      JSON.stringify(payload),
    );
    return "ok";
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    return code === 404 || code === 410 ? "gone" : "error";
  }
}

/** Payload push ngắn gọn cho danh sách nhắc nhở. */
export function reminderPushPayload(items: ReminderItem[]): PushPayload {
  const first = items[0];
  return {
    title: `⏰ ${items.length} khoản đến hạn`,
    body: items.length === 1 ? first.label : `${first.label} +${items.length - 1} khoản khác`,
    url: "/",
  };
}
