import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import {
  createRecurring,
  deleteRecurring,
  runRecurringNow,
  toggleRecurring,
  updateRecurring,
} from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { INCOME: "Thu", EXPENSE: "Chi", TRANSFER: "Chuyển" };
const FREQ_LABEL: Record<string, string> = { DAILY: "Hằng ngày", WEEKLY: "Hằng tuần", MONTHLY: "Hằng tháng" };

const toInputDate = (d: Date) => d.toISOString().slice(0, 10);

export default async function RecurringPage() {
  const now = new Date();
  const [accounts, categories, items] = await Promise.all([
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.recurringTransaction.findMany({
      orderBy: { nextRun: "asc" },
      include: { account: true, toAccount: true, category: true },
    }),
  ]);
  const dueCount = items.filter((r) => r.active && r.nextRun <= now).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Giao dịch định kỳ</h1>
        <form action={runRecurringNow}>
          <button className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10">
            ▶ Chạy ngay{dueCount > 0 ? ` (${dueCount} tới hạn)` : ""}
          </button>
        </form>
      </div>
      <p className="text-sm text-gray-400">
        Tự sinh giao dịch theo lịch (lương, tiền nhà, subscription...). Bấm "Chạy ngay" hoặc gọi cron
        <code className="mx-1 rounded bg-white/10 px-1">/api/recurring/run</code>để sinh các kỳ tới hạn.
      </p>

      {accounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-gray-400">
          Cần có tài khoản trước. Vào <a href="/accounts" className="text-emerald-400 underline">Tài khoản</a>.
        </p>
      ) : (
        <form action={createRecurring} className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Loại</span>
            <select name="type" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              <option value="EXPENSE">Chi</option>
              <option value="INCOME">Thu</option>
              <option value="TRANSFER">Chuyển khoản</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Số tiền (VND)</span>
            <input name="amount" type="number" step="1000" min="0" required className="rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Tần suất</span>
            <select name="frequency" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              <option value="MONTHLY">Hằng tháng</option>
              <option value="WEEKLY">Hằng tuần</option>
              <option value="DAILY">Hằng ngày</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Tài khoản (nguồn)</span>
            <select name="accountId" required className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Đến tài khoản (khi chuyển)</span>
            <select name="toAccountId" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              <option value="">—</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Danh mục</span>
            <select name="categoryId" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Bắt đầu</span>
            <input name="startDate" type="date" required className="rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Kết thúc (tuỳ chọn)</span>
            <input name="endDate" type="date" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
          </label>
          <input name="note" placeholder="Ghi chú" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 sm:col-span-2" />
          <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400 sm:col-span-1">+ Thêm định kỳ</button>
        </form>
      )}

      <div className="space-y-2">
        {items.length === 0 && <p className="text-gray-400">Chưa có giao dịch định kỳ nào.</p>}
        {items.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border border-white/10 bg-white/5 px-4 py-3 ${!r.active ? "opacity-60" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">
                  {TYPE_LABEL[r.type]} · {formatMoney(Number(r.amount))} · {FREQ_LABEL[r.frequency]}
                  {r.note ? ` · ${r.note}` : ""}
                </div>
                <div className="text-xs text-gray-400">
                  {r.account.name}
                  {r.toAccount ? ` → ${r.toAccount.name}` : ""}
                  {r.category ? ` · ${r.category.name}` : ""} · kỳ tới {formatDate(r.nextRun)}
                  {!r.active ? " · (đã dừng)" : r.nextRun <= now ? " · ⏰ tới hạn" : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <form action={toggleRecurring}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="active" value={r.active ? "false" : "true"} />
                  <button className="rounded-lg border border-white/15 px-2.5 py-1 text-xs hover:bg-white/10">
                    {r.active ? "Tạm dừng" : "Tiếp tục"}
                  </button>
                </form>
                <form action={deleteRecurring}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10">Xoá</button>
                </form>
              </div>
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-sky-400">Sửa</summary>
              <form action={updateRecurring} className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={r.id} />
                <label className="flex flex-col text-xs">
                  <span className="mb-1 text-gray-400">Số tiền</span>
                  <input name="amount" type="number" step="1000" min="0" defaultValue={Number(r.amount)} className="w-32 rounded-lg border border-white/10 bg-black/30 px-2 py-1" />
                </label>
                <label className="flex flex-col text-xs">
                  <span className="mb-1 text-gray-400">Tần suất</span>
                  <select name="frequency" defaultValue={r.frequency} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1">
                    <option value="MONTHLY">Hằng tháng</option>
                    <option value="WEEKLY">Hằng tuần</option>
                    <option value="DAILY">Hằng ngày</option>
                  </select>
                </label>
                <label className="flex flex-col text-xs">
                  <span className="mb-1 text-gray-400">Kỳ tới</span>
                  <input name="nextRun" type="date" defaultValue={toInputDate(r.nextRun)} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1" />
                </label>
                <label className="flex flex-col text-xs">
                  <span className="mb-1 text-gray-400">Kết thúc</span>
                  <input name="endDate" type="date" defaultValue={r.endDate ? toInputDate(r.endDate) : ""} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1" />
                </label>
                <label className="flex flex-col text-xs">
                  <span className="mb-1 text-gray-400">Ghi chú</span>
                  <input name="note" defaultValue={r.note ?? ""} className="w-40 rounded-lg border border-white/10 bg-black/30 px-2 py-1" />
                </label>
                <button className="rounded-lg border border-emerald-500/40 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10">Lưu</button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
