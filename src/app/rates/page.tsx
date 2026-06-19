import { prisma } from "@/lib/db";
import { setRate, deleteRate, refreshRates } from "./actions";

export const dynamic = "force-dynamic";

const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(d);

export default async function RatesPage() {
  const rates = await prisma.exchangeRate.findMany({ orderBy: { code: "asc" } });
  const hasForeign = rates.some((r) => r.code !== "VND");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Tỷ giá</h1>
        {hasForeign && (
          <form action={refreshRates}>
            <button className="rounded-lg border border-sky-500/40 px-3 py-1.5 text-sm text-sky-400 hover:bg-sky-500/10">
              ↻ Cập nhật tỷ giá từ API
            </button>
          </form>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Tiền tệ gốc là <b>VND</b>. Đặt tỷ giá: <b>1 đơn vị ngoại tệ = bao nhiêu VND</b> (vd USD = 25000).
        Net Worth quy đổi mọi tài khoản/đầu tư/nợ về VND theo các tỷ giá này.
      </p>

      <form action={setRate} className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Mã tiền tệ</span>
          <input name="code" required placeholder="USD" maxLength={5} className="w-28 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2 uppercase" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">= ? VND</span>
          <input name="rate" type="number" step="any" min="0" required placeholder="25000" className="w-40 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
        </label>
        <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">Lưu tỷ giá</button>
      </form>

      <div className="space-y-2">
        {rates.map((r) => (
          <div key={r.code} className="flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 px-4 py-2.5">
            <div className="text-sm">
              <span className="font-medium">{r.code}</span>
              <span className="text-gray-500 dark:text-gray-400"> = {new Intl.NumberFormat("vi-VN").format(Number(r.rate))} VND</span>
              {r.code !== "VND" && <span className="ml-2 text-xs text-gray-600 dark:text-gray-500">cập nhật {fmtTime(r.updatedAt)}</span>}
            </div>
            {r.code !== "VND" && (
              <form action={deleteRate}>
                <input type="hidden" name="code" value={r.code} />
                <button className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10">Xoá</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
