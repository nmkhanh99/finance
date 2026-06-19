import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { evaluateBudget } from "@/lib/budget";
import { convertToBase } from "@/lib/currency";
import { loadRates } from "@/lib/rates";
import { setBudget } from "./actions";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [categories, monthTxs, rates] = await Promise.all([
    prisma.category.findMany({
      where: { type: "EXPENSE" },
      orderBy: { name: "asc" },
      include: { budget: true },
    }),
    prisma.transaction.findMany({
      where: { type: "EXPENSE", date: { gte: monthStart, lt: monthEnd } },
      select: { categoryId: true, amount: true, account: { select: { currency: true } } },
    }),
    loadRates(),
  ]);

  // Chi tiêu mỗi danh mục, quy đổi về VND theo tiền tệ tài khoản
  const spentMap = new Map<string, number>();
  for (const t of monthTxs) {
    if (!t.categoryId) continue;
    const amt = convertToBase(Number(t.amount), t.account.currency, rates);
    spentMap.set(t.categoryId, (spentMap.get(t.categoryId) ?? 0) + amt);
  }

  const rows = categories.map((c) => {
    const limit = c.budget ? Number(c.budget.limitAmount) : 0;
    const spent = spentMap.get(c.id) ?? 0;
    const ev = evaluateBudget(limit, spent);
    return { c, limit, spent, ev, hasBudget: !!c.budget };
  });

  const overCount = rows.filter((r) => r.hasBudget && r.ev.isOver).length;
  const monthName = `${now.getMonth() + 1}/${now.getFullYear()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Ngân sách tháng {monthName}</h1>
        {overCount > 0 && (
          <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-sm text-red-300">
            ⚠️ {overCount} danh mục vượt ngân sách
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Đặt hạn mức chi mỗi tháng cho từng danh mục. Để trống / 0 để bỏ ngân sách.
      </p>

      {categories.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Chưa có danh mục chi. Vào <a href="/categories" className="text-emerald-400 underline">Danh mục</a> để thêm.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map(({ c, limit, spent, ev, hasBudget }) => {
            const barColor = !hasBudget
              ? "bg-black/10 dark:bg-white/20"
              : ev.isOver
                ? "bg-red-400"
                : ev.percent >= 80
                  ? "bg-amber-400"
                  : "bg-emerald-400";
            const width = hasBudget && limit > 0 ? Math.min(ev.percent, 100) : 0;
            return (
              <div key={c.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{c.name}</div>
                  <form action={setBudget} className="flex items-center gap-2">
                    <input type="hidden" name="categoryId" value={c.id} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Hạn mức/tháng</span>
                    <input
                      name="limitAmount"
                      type="number"
                      step="10000"
                      min="0"
                      defaultValue={hasBudget ? limit : ""}
                      placeholder="0"
                      className="w-36 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-1.5 text-right text-sm"
                    />
                    <button className="rounded-lg border border-black/15 dark:border-white/15 px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10">Lưu</button>
                  </form>
                </div>

                {hasBudget && (
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                      <div className={`h-full ${barColor}`} style={{ width: `${width}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Đã chi {formatMoney(spent)} / {formatMoney(limit)} ({ev.percent}%)
                      </span>
                      <span className={ev.isOver ? "text-red-400" : "text-gray-500 dark:text-gray-400"}>
                        {ev.isOver ? `Vượt ${formatMoney(-ev.remaining)}` : `Còn ${formatMoney(ev.remaining)}`}
                      </span>
                    </div>
                  </div>
                )}
                {!hasBudget && spent > 0 && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-500">Đã chi {formatMoney(spent)} tháng này (chưa đặt hạn mức)</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
