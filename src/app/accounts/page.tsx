import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { convertToBase } from "@/lib/currency";
import { requireUserId } from "@/lib/currentUser";
import MoneyInput from "../MoneyInput";
import { createAccount, updateBalance, deleteAccount } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { CASH: "Tiền mặt", BANK: "Ngân hàng" };

export default async function AccountsPage() {
  const userId = await requireUserId();
  const [accounts, rateRows] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.exchangeRate.findMany(),
  ]);
  const rates: Record<string, number> = {};
  for (const r of rateRows) rates[r.code] = Number(r.rate);
  const total = accounts.reduce((s, a) => s + convertToBase(Number(a.balance), a.currency, rates), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Tài khoản</h1>
        <span className="text-gray-500 dark:text-gray-400">
          Tổng (quy đổi VND): <span className="font-semibold text-sky-400">{formatMoney(total)}</span>
        </span>
      </div>

      {/* Form thêm tài khoản */}
      <form
        action={createAccount}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4"
      >
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Tên</span>
          <input
            name="name"
            required
            placeholder="VD: Vietcombank"
            className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Loại</span>
          <select name="type" className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2">
            <option value="BANK">Ngân hàng</option>
            <option value="CASH">Tiền mặt</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Số dư</span>
          <MoneyInput
            name="balance"
            defaultValue={0}
            className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Tiền tệ</span>
          <input
            name="currency"
            defaultValue="VND"
            maxLength={5}
            className="w-24 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2 uppercase"
          />
        </label>
        <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">
          + Thêm
        </button>
      </form>

      {/* Danh sách */}
      <div className="space-y-2">
        {accounts.length === 0 && <p className="text-gray-500 dark:text-gray-400">Chưa có tài khoản nào.</p>}
        {accounts.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 px-4 py-3"
          >
            <div>
              <div className="font-medium">{a.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {TYPE_LABEL[a.type]} · {a.currency} · {formatMoney(Number(a.balance), a.currency)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <form action={updateBalance} className="flex items-center gap-2">
                <input type="hidden" name="id" value={a.id} />
                <MoneyInput
                  name="balance"
                  defaultValue={Number(a.balance)}
                  className="w-40 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-1.5 text-right"
                />
                <button className="rounded-lg border border-black/15 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                  Lưu
                </button>
              </form>
              <form action={deleteAccount}>
                <input type="hidden" name="id" value={a.id} />
                <button className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">
                  Xoá
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
