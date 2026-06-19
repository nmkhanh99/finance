import "server-only";
import nodemailer from "nodemailer";
import type { ReminderItem } from "./reminders";

/** Email bật khi đã cấu hình SMTP_HOST + SMTP_PORT. */
export function emailEnabled(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

function transport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // true cho cổng 465
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<void> {
  if (!emailEnabled()) throw new Error("SMTP chưa cấu hình (đặt SMTP_HOST/SMTP_PORT).");
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "finance@localhost";
  await transport().sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
}

const fmtDate = (d: Date) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(d);

/** HTML cho email nhắc nhở đến hạn. */
export function reminderDigestHtml(items: ReminderItem[], username: string): string {
  const rows = items
    .map((r) => {
      const when =
        r.status === "overdue" ? `Quá hạn ${-r.days} ngày` : `Còn ${r.days} ngày`;
      const color = r.status === "overdue" ? "#dc2626" : "#d97706";
      return `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(r.label)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee">${fmtDate(r.due)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;color:${color};font-weight:600">${when}</td>
      </tr>`;
    })
    .join("");
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px">
    <h2 style="margin:0 0 4px">⏰ Nhắc nhở tài chính</h2>
    <p style="color:#666;margin:0 0 16px">Chào ${escapeHtml(username)}, bạn có ${items.length} khoản sắp/đã đến hạn:</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <thead><tr style="text-align:left;color:#888">
        <th style="padding:6px 12px">Khoản</th><th style="padding:6px 12px">Hạn</th><th style="padding:6px 12px">Tình trạng</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#999;font-size:12px;margin-top:16px">Email tự động từ app Quản lý Tài chính Cá nhân.</p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
