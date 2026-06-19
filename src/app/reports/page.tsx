import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { simulatePayoff, amortizingMonthlyPayment, type DebtForSim } from "@/lib/finance";
import { convertToBase } from "@/lib/currency";
import { loadRates } from "@/lib/rates";
import CashFlowChart, { type MonthPoint } from "./CashFlowChart";
import NetWorthChart, { type NetWorthPoint } from "./NetWorthChart";
import { snapshotNetWorth } from "./actions";

export const dynamic = "force-dynamic";

function monthsLabel(months: number): string {
  if (months >= 1200) return "không trả hết ở mức này";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${months} tháng${y > 0 ? ` (~${y} năm ${m} tháng)` : ""}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ extra?: string }>;
}) {
  const sp = await searchParams;
  const extra = Math.max(Number(sp.extra ?? 0) || 0, 0);
  const rates = await loadRates(); // số tiền quy đổi về VND theo tiền tệ tài khoản

  // ----- Net Worth theo thời gian (snapshot) -----
  const snapshots = await prisma.netWorthSnapshot.findMany({ orderBy: { date: "asc" }, take: 180 });
  const nwSeries: NetWorthPoint[] = snapshots.map((s) => ({
    date: `${s.date.getUTCDate()}/${s.date.getUTCMonth() + 1}`,
    netWorth: Number(s.netWorth),
  }));

  // ----- Dòng tiền tháng hiện tại -----
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const txs = await prisma.transaction.findMany({
    where: { date: { gte: monthStart, lt: monthEnd }, type: { in: ["INCOME", "EXPENSE"] } },
    include: { category: true, account: { select: { currency: true } } },
  });

  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, number>();
  for (const t of txs) {
    const amt = convertToBase(Number(t.amount), t.account.currency, rates);
    if (t.type === "INCOME") income += amt;
    else {
      expense += amt;
      const key = t.category?.name ?? "Khác";
      byCategory.set(key, (byCategory.get(key) ?? 0) + amt);
    }
  }
  const net = income - expense;
  const catRows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = catRows[0]?.[1] ?? 0;

  // ----- Dòng tiền 6 tháng gần nhất (cho biểu đồ) -----
  const chartStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const recentTxs = await prisma.transaction.findMany({
    where: { date: { gte: chartStart, lt: monthEnd }, type: { in: ["INCOME", "EXPENSE"] } },
    select: { type: true, amount: true, date: true, account: { select: { currency: true } } },
  });
  const months: MonthPoint[] = [];
  const monthIndex = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthIndex.set(key, months.length);
    months.push({ month: `${d.getMonth() + 1}/${d.getFullYear()}`, thu: 0, chi: 0 });
  }
  for (const t of recentTxs) {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    const idx = monthIndex.get(key);
    if (idx === undefined) continue;
    const amt = convertToBase(Number(t.amount), t.account.currency, rates);
    if (t.type === "INCOME") months[idx].thu += amt;
    else months[idx].chi += amt;
  }

  // ----- Trả nợ: Avalanche vs Snowball -----
  const debts = await prisma.debt.findMany({ include: { payments: true } });
  const simDebts: DebtForSim[] = debts.map((d) => {
    const principal = Number(d.principal);
    const rate = Number(d.interestRate);
    const paid = d.payments.reduce((s, p) => s + Number(p.principal), 0);
    const balance = Math.max(principal - paid, 0);
    return {
      id: d.id,
      name: d.name,
      balance,
      annualRate: rate,
      minPayment: amortizingMonthlyPayment(balance || 1, rate, d.termMonths),
    };
  }).filter((d) => d.balance > 0);

  const avalanche = simDebts.length ? simulatePayoff(simDebts, extra, "avalanche") : null;
  const snowball = simDebts.length ? simulatePayoff(simDebts, extra, "snowball") : null;
  const interestSaved =
    avalanche && snowball ? snowball.totalInterest - avalanche.totalInterest : 0;

  const monthName = `${now.getMonth() + 1}/${now.getFullYear()}`;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold">Báo cáo</h1>

      {/* Net Worth theo thời gian */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Net Worth theo thời gian</h2>
          <form action={snapshotNetWorth}>
            <button className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10">
              📌 Ghi lại Net Worth hôm nay
            </button>
          </form>
        </div>
        {nwSeries.length >= 2 ? (
          <NetWorthChart data={nwSeries} />
        ) : (
          <p className="rounded-xl border border-dashed border-black/15 dark:border-white/15 p-5 text-center text-sm text-gray-500 dark:text-gray-400">
            {nwSeries.length === 0
              ? "Chưa có dữ liệu. Bấm \"Ghi lại Net Worth hôm nay\" để bắt đầu theo dõi (mỗi ngày 1 điểm)."
              : "Đã có 1 điểm. Ghi thêm vào những ngày sau để vẽ đường biến động."}
          </p>
        )}
      </section>

      {/* Biểu đồ dòng tiền 6 tháng */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Dòng tiền 6 tháng gần nhất</h2>
        <CashFlowChart data={months} />
      </section>

      {/* Dòng tiền tháng */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Dòng tiền tháng {monthName}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-5">
            <div className="text-sm text-gray-500 dark:text-gray-400">Thu</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-400">{formatMoney(income)}</div>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-5">
            <div className="text-sm text-gray-500 dark:text-gray-400">Chi</div>
            <div className="mt-1 text-2xl font-semibold text-red-400">{formatMoney(expense)}</div>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-5">
            <div className="text-sm text-gray-500 dark:text-gray-400">Còn lại (tiết kiệm)</div>
            <div className={`mt-1 text-2xl font-semibold ${net >= 0 ? "text-sky-400" : "text-red-400"}`}>
              {formatMoney(net)}
            </div>
          </div>
        </div>

        {/* Chi theo danh mục */}
        {catRows.length > 0 ? (
          <div className="space-y-2 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-5">
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">Chi theo danh mục</div>
            {catRows.map(([name, amt]) => (
              <div key={name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatMoney(amt)} · {expense > 0 ? ((amt / expense) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div className="h-full bg-amber-400" style={{ width: `${maxCat > 0 ? (amt / maxCat) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có khoản chi nào trong tháng này.</p>
        )}
      </section>

      {/* Chiến lược trả nợ */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Chiến lược trả nợ: Avalanche vs Snowball</h2>

        {simDebts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Không có khoản nợ nào để mô phỏng.</p>
        ) : (
          <>
            <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4">
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-gray-500 dark:text-gray-400">Số tiền trả thêm mỗi tháng (ngoài mức tối thiểu)</span>
                <input
                  name="extra"
                  type="number"
                  step="100000"
                  min="0"
                  defaultValue={extra}
                  className="w-56 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
                />
              </label>
              <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">
                Tính lại
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-500">
                Mức trả tối thiểu/tháng được ước tính theo gốc & kỳ hạn từng khoản.
              </span>
            </form>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { key: "avalanche", title: "🏔️ Avalanche", desc: "Ưu tiên khoản lãi suất cao nhất — tiết kiệm tổng lãi", r: avalanche },
                { key: "snowball", title: "❄️ Snowball", desc: "Ưu tiên khoản dư nợ nhỏ nhất — tạo động lực", r: snowball },
              ].map((c) => (
                <div
                  key={c.key}
                  className={`rounded-2xl border p-5 ${
                    c.key === "avalanche" && interestSaved > 0
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5"
                  }`}
                >
                  <div className="font-medium">{c.title}</div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{c.desc}</div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Thời gian trả hết</span>
                      <span className="font-semibold">{c.r ? monthsLabel(c.r.months) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tổng lãi phải trả</span>
                      <span className="font-semibold text-amber-400">{c.r ? formatMoney(c.r.totalInterest) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tổng tiền trả</span>
                      <span className="font-semibold">{c.r ? formatMoney(c.r.totalPaid) : "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {interestSaved > 0 && (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                💡 Avalanche tiết kiệm hơn <span className="font-semibold">{formatMoney(interestSaved)}</span> tiền lãi so với Snowball.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
