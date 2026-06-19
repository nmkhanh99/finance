import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { createTransaction, deleteTransaction } from "./actions";
import { buildTransactionWhere, type TxFilters } from "@/lib/txFilter";
import { requireUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; sign: string; color: string }> = {
  INCOME: { label: "Thu", sign: "+", color: "text-emerald-400" },
  EXPENSE: { label: "Chi", sign: "−", color: "text-red-400" },
  TRANSFER: { label: "Chuyển", sign: "", color: "text-sky-400" },
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TxFilters>;
}) {
  const userId = await requireUserId();
  const f = await searchParams;
  const filterWhere = buildTransactionWhere(f);
  const hasFilter = Object.keys(filterWhere).length > 0;
  const where = { ...filterWhere, userId };
  const exportQs = new URLSearchParams(
    Object.entries(f).filter(([, v]) => v) as [string, string][],
  ).toString();

  const [accounts, categories, transactions, agg] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: 100,
      include: { account: true, toAccount: true, category: true },
    }),
    prisma.transaction.aggregate({ where, _count: true, _sum: { amount: true } }),
  ]);
  const resultCount = agg._count;
  const resultSum = Number(agg._sum.amount ?? 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Giao dịch</h1>

      {accounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 dark:border-white/15 p-6 text-center text-gray-500 dark:text-gray-400">
          Cần có tài khoản trước. Vào{" "}
          <a href="/accounts" className="text-emerald-400 underline">
            Tài khoản
          </a>
          .
        </p>
      ) : (
        <form
          action={createTransaction}
          className="grid grid-cols-1 gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4 sm:grid-cols-3"
        >
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-500 dark:text-gray-400">Loại</span>
            <select name="type" className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2">
              <option value="EXPENSE">Chi</option>
              <option value="INCOME">Thu</option>
              <option value="TRANSFER">Chuyển khoản</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-500 dark:text-gray-400">Số tiền (VND)</span>
            <input
              name="amount"
              type="number"
              step="1000"
              min="0"
              required
              className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-500 dark:text-gray-400">Ngày</span>
            <input
              name="date"
              type="date"
              className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-500 dark:text-gray-400">Tài khoản (nguồn)</span>
            <select
              name="accountId"
              required
              className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-gray-500 dark:text-gray-400">Đến tài khoản (chỉ khi chuyển)</span>
            <select
              name="toAccountId"
              className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
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
            <span className="mb-1 text-gray-500 dark:text-gray-400">Danh mục</span>
            <select
              name="categoryId"
              className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
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
            className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2 sm:col-span-2"
          />
          <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">
            + Ghi giao dịch
          </button>
        </form>
      )}

      {/* Bộ lọc / tìm kiếm */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4"
      >
        <label className="flex flex-col text-xs">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Tìm ghi chú</span>
          <input name="q" defaultValue={f.q ?? ""} placeholder="từ khoá..." className="w-40 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col text-xs">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Loại</span>
          <select name="type" defaultValue={f.type ?? ""} className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-1.5 text-sm">
            <option value="">Tất cả</option>
            <option value="EXPENSE">Chi</option>
            <option value="INCOME">Thu</option>
            <option value="TRANSFER">Chuyển</option>
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Tài khoản</span>
          <select name="accountId" defaultValue={f.accountId ?? ""} className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-1.5 text-sm">
            <option value="">Tất cả</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Danh mục</span>
          <select name="categoryId" defaultValue={f.categoryId ?? ""} className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-1.5 text-sm">
            <option value="">Tất cả</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Tháng</span>
          <input name="month" type="month" defaultValue={f.month ?? ""} className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-1.5 text-sm" />
        </label>
        <button className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400">Lọc</button>
        {hasFilter && (
          <a href="/transactions" className="rounded-lg border border-black/15 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10">Xoá lọc</a>
        )}
      </form>

      {/* Tổng kết kết quả */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>
          {resultCount} giao dịch{hasFilter ? " (đã lọc)" : ""} · tổng {formatMoney(resultSum)}
          {resultCount > transactions.length ? ` · hiển thị ${transactions.length} mới nhất` : ""}
        </span>
        {resultCount > 0 && (
          <a
            href={`/api/transactions/export${exportQs ? `?${exportQs}` : ""}`}
            className="rounded-lg border border-black/15 dark:border-white/15 px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10"
          >
            ⬇ Xuất CSV
          </a>
        )}
      </div>

      <div className="space-y-2">
        {transactions.length === 0 && <p className="text-gray-500 dark:text-gray-400">Không có giao dịch khớp.</p>}
        {transactions.map((t) => {
          const meta = TYPE_META[t.type];
          return (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {meta.label}
                  {t.category ? ` · ${t.category.name}` : ""}
                  {t.note ? ` · ${t.note}` : ""}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
