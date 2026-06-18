import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeNetWorth } from "@/lib/networth";
import { evaluateBudget } from "@/lib/budget";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; sign: string; color: string }> = {
  INCOME: { label: "Thu", sign: "+", color: "text-emerald-400" },
  EXPENSE: { label: "Chi", sign: "−", color: "text-red-400" },
  TRANSFER: { label: "Chuyển", sign: "", color: "text-sky-400" },
};

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthRange = { gte: monthStart, lt: monthEnd };

  const [nwb, accountCount, monthAgg, budgets, spentByCat, recent] = await Promise.all([
    computeNetWorth(),
    prisma.account.count(),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { date: monthRange, type: { in: ["INCOME", "EXPENSE"] } },
      _sum: { amount: true },
    }),
    prisma.budget.findMany(),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { type: "EXPENSE", date: monthRange },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { account: true, toAccount: true, category: true },
    }),
  ]);

  const { totalCash, totalInvest, totalDebt, netWorth: nw } = nwb;

  // Dòng tiền tháng
  const income = Number(monthAgg.find((r) => r.type === "INCOME")?._sum.amount ?? 0);
  const expense = Number(monthAgg.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0);
  const monthNet = income - expense;

  // Cảnh báo ngân sách
  const spentMap = new Map<string, number>();
  for (const r of spentByCat) if (r.categoryId) spentMap.set(r.categoryId, Number(r._sum.amount ?? 0));
  const overCount = budgets.filter(
    (b) => evaluateBudget(Number(b.limitAmount), spentMap.get(b.categoryId) ?? 0).isOver,
  ).length;

  const monthName = `${now.getMonth() + 1}/${now.getFullYear()}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg text-gray-400">Tài sản ròng (Net Worth)</h1>
        <div className={`mt-1 text-4xl font-bold ${nw >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {formatMoney(nw)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Tiền mặt + Ngân hàng" value={formatMoney(totalCash)} accent="text-sky-400" />
        <Stat label="Đầu tư (giá trị TT)" value={formatMoney(totalInvest)} accent="text-amber-400" />
        <Stat label="Tổng dư nợ" value={formatMoney(totalDebt)} accent="text-red-400" />
      </div>

      {/* Dòng tiền tháng */}
      <div>
        <h2 className="mb-3 text-sm text-gray-400">Dòng tiền tháng {monthName}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Thu" value={formatMoney(income)} accent="text-emerald-400" />
          <Stat label="Chi" value={formatMoney(expense)} accent="text-red-400" />
          <Stat
            label="Còn lại (tiết kiệm)"
            value={formatMoney(monthNet)}
            accent={monthNet >= 0 ? "text-sky-400" : "text-red-400"}
          />
        </div>
      </div>

      {/* Cảnh báo ngân sách */}
      {overCount > 0 && (
        <Link
          href="/budgets"
          className="block rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 hover:bg-red-500/15"
        >
          ⚠️ {overCount} danh mục đang vượt ngân sách tháng này — xem chi tiết →
        </Link>
      )}

      {/* Giao dịch gần đây */}
      {recent.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm text-gray-400">Giao dịch gần đây</h2>
            <Link href="/transactions" className="text-xs text-emerald-400 hover:underline">
              Tất cả →
            </Link>
          </div>
          <div className="space-y-2">
            {recent.map((t) => {
              const meta = TYPE_META[t.type];
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">
                      {meta.label}
                      {t.category ? ` · ${t.category.name}` : ""}
                      {t.note ? ` · ${t.note}` : ""}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(t.date)} · {t.account.name}
                      {t.toAccount ? ` → ${t.toAccount.name}` : ""}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${meta.color}`}>
                    {meta.sign}
                    {formatMoney(Number(t.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {accountCount === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-gray-400">
          Chưa có tài khoản nào. Vào{" "}
          <a href="/accounts" className="text-emerald-400 underline">
            Tài khoản
          </a>{" "}
          để thêm tiền mặt / ngân hàng.
        </p>
      )}
    </div>
  );
}
