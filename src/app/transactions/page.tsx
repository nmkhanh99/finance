import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { createTransaction, deleteTransaction } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; sign: string; color: string }> = {
  INCOME: { label: "Thu", sign: "+", color: "text-emerald-400" },
  EXPENSE: { label: "Chi", sign: "−", color: "text-red-400" },
  TRANSFER: { label: "Chuyển", sign: "", color: "text-sky-400" },
};

export default async function TransactionsPage() {
  const [accounts, categories, transactions] = await Promise.all([
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 50,
      include: { account: true, toAccount: true, category: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Giao dịch</h1>

      {accounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-gray-400">
          Cần có tài khoản trước. Vào{" "}
          <a href="/accounts" className="text-emerald-400 underline">
            Tài khoản
          </a>
          .
        </p>
      ) : (
        <form
          action={createTransaction}
          className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3"
        >
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
            <input
              name="amount"
              type="number"
              step="1000"
              min="0"
              required
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Ngày</span>
            <input
              name="date"
              type="date"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Tài khoản (nguồn)</span>
            <select
              name="accountId"
              required
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Đến tài khoản (chỉ khi chuyển)</span>
            <select
              name="toAccountId"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            >
              <option value="">—</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-400">Danh mục</span>
            <select
              name="categoryId"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <input
            name="note"
            placeholder="Ghi chú (tuỳ chọn)"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 sm:col-span-2"
          />
          <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">
            + Ghi giao dịch
          </button>
        </form>
      )}

      <div className="space-y-2">
        {transactions.length === 0 && <p className="text-gray-400">Chưa có giao dịch.</p>}
        {transactions.map((t) => {
          const meta = TYPE_META[t.type];
          return (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {meta.label}
                  {t.category ? ` · ${t.category.name}` : ""}
                  {t.note ? ` · ${t.note}` : ""}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDate(t.date)} · {t.account.name}
                  {t.toAccount ? ` → ${t.toAccount.name}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${meta.color}`}>
                  {meta.sign}
                  {formatMoney(Number(t.amount))}
                </span>
                <form action={deleteTransaction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10">
                    Xoá
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
