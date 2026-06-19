"use client";

import { useState } from "react";
import { addExpense } from "../actions";

interface Member {
  id: string;
  name: string;
}

interface Account {
  id: string;
  name: string;
  currency: string;
}

export default function ExpenseForm({
  groupId,
  members,
  accounts,
  selfMemberId,
}: {
  groupId: string;
  members: Member[];
  accounts: Account[];
  selfMemberId: string | null;
}) {
  const [mode, setMode] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [currency, setCurrency] = useState("VND");
  const [payerId, setPayerId] = useState(members[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(members.map((m) => m.id)));
  const [payRows, setPayRows] = useState<{ accountId: string; amount: string }[]>([{ accountId: "", amount: "" }]);
  const cur = currency.trim().toUpperCase() || "VND";

  // Chỉ cho ghi giao dịch khi người trả là "bạn" và đã có tài khoản.
  const showPay = selfMemberId !== null && payerId === selfMemberId && accounts.length > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setRow(i: number, patch: Partial<{ accountId: string; amount: string }>) {
    setPayRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <form
      action={addExpense}
      className="grid grid-cols-1 gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="splitType" value={mode} />

      <label className="flex flex-col text-sm sm:col-span-2">
        <span className="mb-1 text-gray-500 dark:text-gray-400">Nội dung chi phí *</span>
        <input name="description" required placeholder="VD: Ăn tối nhà hàng X" className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
      </label>

      <label className="flex flex-col text-sm">
        <span className="mb-1 text-gray-500 dark:text-gray-400">Người trả</span>
        <select
          name="payerId"
          required
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}{m.id === selfMemberId ? " (Tôi)" : ""}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm">
        <span className="mb-1 text-gray-500 dark:text-gray-400">Ngày</span>
        <input name="date" type="date" className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
      </label>

      <label className="flex flex-col text-sm">
        <span className="mb-1 text-gray-500 dark:text-gray-400">Tiền tệ</span>
        <input
          name="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          maxLength={5}
          placeholder="VND"
          className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2 uppercase"
        />
        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Báo cáo quy đổi về VND theo tỷ giá (trang Tỷ giá).</span>
      </label>

      {/* Chế độ chia */}
      <div className="flex items-center gap-2 text-sm sm:col-span-2">
        <span className="text-gray-500 dark:text-gray-400">Cách chia:</span>
        <button
          type="button"
          onClick={() => setMode("EQUAL")}
          className={`rounded-lg px-3 py-1 ${mode === "EQUAL" ? "bg-emerald-500 text-black" : "border border-black/15 dark:border-white/15"}`}
        >
          Chia đều
        </button>
        <button
          type="button"
          onClick={() => setMode("CUSTOM")}
          className={`rounded-lg px-3 py-1 ${mode === "CUSTOM" ? "bg-emerald-500 text-black" : "border border-black/15 dark:border-white/15"}`}
        >
          Tùy chỉnh
        </button>
      </div>

      {mode === "EQUAL" && (
        <label className="flex flex-col text-sm sm:col-span-2">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Tổng số tiền ({cur}) — chia đều cho người được chọn</span>
          <input name="amount" type="number" step="any" min="0" required className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
        </label>
      )}

      {/* Người tham gia */}
      <div className="sm:col-span-2">
        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Chia cho ({selected.size} người){mode === "CUSTOM" ? ` — nhập số tiền mỗi người (${cur})` : ""}:
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {members.map((m) => {
            const on = selected.has(m.id);
            return (
              <div
                key={m.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${on ? "border-emerald-500/40 bg-emerald-500/5" : "border-black/10 dark:border-white/10"}`}
              >
                <label className="flex flex-1 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="participants"
                    value={m.id}
                    checked={on}
                    onChange={() => toggle(m.id)}
                  />
                  {m.name}
                </label>
                {mode === "CUSTOM" && on && (
                  <input
                    name={`share_${m.id}`}
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    className="w-24 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-2 py-1 text-right text-sm"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bạn ứng tiền -> trừ vào (nhiều) tài khoản cá nhân (tùy chọn) */}
      {showPay && (
        <div className="sm:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="mb-2 text-sm font-medium text-emerald-400">Bạn ứng tiền — trừ vào tài khoản (tùy chọn)</div>
          <div className="space-y-2">
            {payRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  name="payAccountId"
                  value={row.accountId}
                  onChange={(e) => setRow(i, { accountId: e.target.value })}
                  className="flex-1 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2 text-sm"
                >
                  <option value="">— Chọn tài khoản —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                  ))}
                </select>
                <input
                  name="payAmount"
                  type="number"
                  step="any"
                  min="0"
                  value={row.amount}
                  onChange={(e) => setRow(i, { amount: e.target.value })}
                  placeholder="Số tiền"
                  className="w-32 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2 text-right text-sm"
                />
                {payRows.length > 1 && (
                  <button type="button" onClick={() => setPayRows((r) => r.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300" title="Bỏ dòng">×</button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPayRows((r) => [...r, { accountId: "", amount: "" }])}
            className="mt-2 rounded-lg border border-black/15 dark:border-white/15 px-3 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
          >
            + Thêm nguồn trả
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Số tiền theo tiền tệ của từng tài khoản. Mỗi dòng tạo 1 giao dịch chi, trừ vào số dư. Để trống nếu không muốn ghi giao dịch.</p>
        </div>
      )}

      <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400 sm:col-span-2">
        + Thêm chi phí
      </button>
    </form>
  );
}
