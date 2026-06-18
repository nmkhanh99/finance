import { prisma } from "@/lib/db";
import { netWorth } from "@/lib/finance";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const [accounts, holdings, debts] = await Promise.all([
    prisma.account.findMany(),
    prisma.holding.findMany({
      include: { prices: { orderBy: { at: "desc" }, take: 1 } },
    }),
    prisma.debt.findMany({ include: { payments: true } }),
  ]);

  const accountBalances = accounts.map((a) => Number(a.balance));

  const holdingsForNW = holdings.map((h) => {
    const latest = h.prices[0]?.price ?? h.avgCost; // chưa có giá thị trường thì dùng giá vốn
    return { quantity: Number(h.quantity), currentPrice: Number(latest) };
  });

  const debtsOutstanding = debts.map((d) => {
    const paidPrincipal = d.payments.reduce((s, p) => s + Number(p.principal), 0);
    return Math.max(Number(d.principal) - paidPrincipal, 0);
  });

  const totalCash = accountBalances.reduce((s, b) => s + b, 0);
  const totalInvest = holdingsForNW.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const totalDebt = debtsOutstanding.reduce((s, d) => s + d, 0);
  const nw = netWorth({ accountBalances, holdings: holdingsForNW, debtsOutstanding });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg text-gray-400">Tài sản ròng (Net Worth)</h1>
        <div
          className={`mt-1 text-4xl font-bold ${nw >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {formatMoney(nw)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Tiền mặt + Ngân hàng" value={formatMoney(totalCash)} accent="text-sky-400" />
        <Stat label="Đầu tư (giá trị TT)" value={formatMoney(totalInvest)} accent="text-amber-400" />
        <Stat label="Tổng dư nợ" value={formatMoney(totalDebt)} accent="text-red-400" />
      </div>

      {accounts.length === 0 && (
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
