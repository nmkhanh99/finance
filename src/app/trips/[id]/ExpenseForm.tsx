"use client";

import { useState } from "react";
import { addExpense } from "../actions";

interface Member {
  id: string;
  name: string;
}

export default function ExpenseForm({ groupId, members }: { groupId: string; members: Member[] }) {
  const [mode, setMode] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [selected, setSelected] = useState<Set<string>>(new Set(members.map((m) => m.id)));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
        <select name="payerId" required className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2">
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm">
        <span className="mb-1 text-gray-500 dark:text-gray-400">Ngày</span>
        <input name="date" type="date" className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
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
          <span className="mb-1 text-gray-500 dark:text-gray-400">Tổng số tiền (VND) — chia đều cho người được chọn</span>
          <input name="amount" type="number" step="1000" min="0" required className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2" />
        </label>
      )}

      {/* Người tham gia */}
      <div className="sm:col-span-2">
        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Chia cho ({selected.size} người){mode === "CUSTOM" ? " — nhập số tiền mỗi người" : ""}:
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
                    step="1000"
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

      <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400 sm:col-span-2">
        + Thêm chi phí
      </button>
    </form>
  );
}
