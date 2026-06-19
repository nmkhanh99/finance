import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/currentUser";
import { emailEnabled } from "@/lib/email";
import { updateEmail, sendTestReminder } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, email: true } });
  const smtp = emailEnabled();

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Cài đặt</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Tài khoản: @{user?.username}</p>
      </div>

      {sp.ok && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{sp.ok}</p>}
      {sp.err && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{sp.err}</p>}

      <section className="space-y-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-5">
        <h2 className="font-medium text-gray-700 dark:text-gray-300">Nhắc nhở qua email</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nhận email tóm tắt các khoản nợ / mục tiêu sắp đến hạn (trong 30 ngày hoặc đã quá hạn). Cron sẽ gửi định kỳ.
        </p>

        <form action={updateEmail} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col text-sm">
            <span className="mb-1 text-gray-500 dark:text-gray-400">Email nhận nhắc nhở</span>
            <input
              name="email"
              type="email"
              defaultValue={user?.email ?? ""}
              placeholder="ban@example.com (để trống = tắt)"
              className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
            />
          </label>
          <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400">Lưu</button>
        </form>

        <div className="flex items-center gap-3 pt-1 text-sm">
          <span className={smtp ? "text-emerald-400" : "text-amber-400"}>
            {smtp ? "● SMTP đã cấu hình" : "● SMTP chưa cấu hình"}
          </span>
          <form action={sendTestReminder}>
            <button
              disabled={!smtp || !user?.email}
              className="rounded-lg border border-black/15 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
            >
              Gửi thử ngay
            </button>
          </form>
        </div>
        {!smtp && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Đặt biến môi trường <code>SMTP_HOST</code>, <code>SMTP_PORT</code> (và <code>SMTP_USER</code>/<code>SMTP_PASS</code>/<code>SMTP_FROM</code>) — xem <code>.env.example</code> — rồi khởi động lại app.
          </p>
        )}
      </section>
    </div>
  );
}
