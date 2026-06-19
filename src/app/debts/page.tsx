import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import {
  amortizingMonthlyPayment,
  amortizationSchedule,
  simpleInterest,
  compoundBalance,
} from "@/lib/finance";
import { requireUserId } from "@/lib/currentUser";
import { createDebt, addPayment, deleteDebt } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  SIMPLE: "Lãi đơn",
  COMPOUND: "Lãi kép",
  AMORTIZING: "Trả góp đều",
};

function summarize(principal: number, rate: number, termMonths: number, type: string) {
  if (type === "SIMPLE") {
    const interest = simpleInterest(principal, rate, termMonths / 12);
    return { monthly: (principal + interest) / termMonths, lifeInterest: interest };
  }
  if (type === "COMPOUND") {
    const balance = compoundBalance(principal, rate, 12, termMonths / 12);
    return { monthly: balance / termMonths, lifeInterest: balance - principal };
  }
  const monthly = amortizingMonthlyPayment(principal, rate, termMonths);
  const lifeInterest = amortizationSchedule(principal, rate, termMonths).reduce(
    (s, r) => s + r.interest,
    0,
  );
  return { monthly, lifeInterest };
}

export default async function DebtsPage() {
  const userId = await requireUserId();
  const debts = await prisma.debt.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { payments: { orderBy: { date: "desc" } } },
  });

  const totalOutstanding = debts.reduce((sum, d) => {
    const paid = d.payments.reduce((s, p) => s + Number(p.principal), 0);
    return sum + Math.max(Number(d.principal) - paid, 0);
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Nợ / Vay</h1>
        <span className="text-gray-500 dark:text-gray-400">
          Tổng dư nợ: <span className="font-semibold text-red-400">{formatMoney(totalOutstanding)}</span>
        </span>
      </div>

      {/* Form thêm khoản vay */}
      <form
        action={createDebt}
        className="grid grid-cols-2 gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4 sm:grid-cols-6"
      >
        <label className="col-span-2 flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Tên khoản vay</span>
          <input
            name="name"
            required
            placeholder="VD: Vay mua xe"
            className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Gốc (VND)</span>
          <input name="principal" type="number" step="1000" min="0" required className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Lãi suất (%/năm)</span>
          <input name="ratePercent" type="number" step="0.1" min="0" required className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Kỳ hạn (tháng)</span>
          <input name="termMonths" type="number" step="1" min="1" required className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Loại lãi</span>
          <select name="interestType" className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2">
            <option value="AMORTIZING">Trả góp đều</option>
            <option value="SIMPLE">Lãi đơn</option>
            <option value="COMPOUND">Lãi kép</option>
          </select>
        </label>
        <label className="col-span-2 flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Ngày bắt đầu</span>
          <input name="startDate" type="date" className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
        </label>
        <button className="col-span-2 self-end rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400 sm:col-span-1">
          + Thêm
        </button>
      </form>

      {/* Danh sách khoản vay */}
      <div className="space-y-4">
        {debts.length === 0 && <p className="text-gray-500 dark:text-gray-400">Chưa có khoản vay nào.</p>}
        {debts.map((d) => {
          const principal = Number(d.principal);
          const rate = Number(d.interestRate);
          const paidPrincipal = d.payments.reduce((s, p) => s + Number(p.principal), 0);
          const paidInterest = d.payments.reduce((s, p) => s + Number(p.interest), 0);
          const outstanding = Math.max(principal - paidPrincipal, 0);
          const s = summarize(principal, rate, d.termMonths, d.interestType);
          const schedule = d.interestType === "AMORTIZING" ? amortizationSchedule(principal, rate, d.termMonths) : [];

          return (
            <div key={d.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-medium">{d.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {TYPE_LABEL[d.interestType]} · {(rate * 100).toFixed(2)}%/năm · {d.termMonths} tháng · từ {formatDate(d.startDate)}
                  </div>
                </div>
                <form action={deleteDebt}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className="rounded-lg border border-red-500/30 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10">Xoá</button>
                </form>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><div className="text-gray-500 dark:text-gray-400">Dư nợ còn lại</div><div className="font-semibold text-red-400">{formatMoney(outstanding)}</div></div>
                <div><div className="text-gray-500 dark:text-gray-400">Trả/tháng (ước tính)</div><div className="font-semibold">{formatMoney(s.monthly)}</div></div>
                <div><div className="text-gray-500 dark:text-gray-400">Tổng lãi cả kỳ</div><div className="font-semibold text-amber-400">{formatMoney(s.lifeInterest)}</div></div>
                <div><div className="text-gray-500 dark:text-gray-400">Đã trả (gốc / lãi)</div><div className="font-semibold">{formatMoney(paidPrincipal)} / {formatMoney(paidInterest)}</div></div>
              </div>

              {/* Ghi nhận trả nợ */}
              <form action={addPayment} className="mt-4 flex flex-wrap items-end gap-2 border-t border-black/10 dark:border-white/10 pt-4">
                <input type="hidden" name="debtId" value={d.id} />
                <label className="flex flex-col text-xs">
                  <span className="mb-1 text-gray-500 dark:text-gray-400">Số tiền trả</span>
                  <input name="amount" type="number" step="1000" min="0" required className="w-40 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-1.5" />
                </label>
                <label className="flex flex-col text-xs">
                  <span className="mb-1 text-gray-500 dark:text-gray-400">Ngày</span>
                  <input name="date" type="date" className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-1.5" />
                </label>
                <button className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10">Ghi nhận trả</button>
                <span className="text-xs text-gray-600 dark:text-gray-500">(tự tách lãi theo dư nợ, phần còn lại trừ vào gốc)</span>
              </form>

              {/* Lịch trả góp */}
              {schedule.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-sky-400">Xem lịch trả góp ({schedule.length} kỳ)</summary>
                  <div className="mt-2 max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#0b0f1a] text-left text-gray-500 dark:text-gray-400">
                        <tr><th className="py-1 pr-2">Kỳ</th><th className="py-1 pr-2 text-right">Trả</th><th className="py-1 pr-2 text-right">Gốc</th><th className="py-1 pr-2 text-right">Lãi</th><th className="py-1 text-right">Dư nợ</th></tr>
                      </thead>
                      <tbody>
                        {schedule.map((r) => (
                          <tr key={r.month} className="border-b border-black/5 dark:border-white/5">
                            <td className="py-1 pr-2">{r.month}</td>
                            <td className="py-1 pr-2 text-right">{formatMoney(r.payment)}</td>
                            <td className="py-1 pr-2 text-right">{formatMoney(r.principal)}</td>
                            <td className="py-1 pr-2 text-right text-amber-400">{formatMoney(r.interest)}</td>
                            <td className="py-1 text-right">{formatMoney(r.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              {/* Lịch sử trả */}
              {d.payments.length > 0 && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Lịch sử trả: {d.payments.map((p) => `${formatDate(p.date)} (${formatMoney(Number(p.amount))})`).join(" · ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
