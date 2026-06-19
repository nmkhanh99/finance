"use client";

import { useActionState } from "react";
import { importTransactions, type ImportResult } from "./actions";

const initial: ImportResult = { done: false, imported: 0, skipped: 0, errors: [] };

export default function ImportForm() {
  const [state, action, pending] = useActionState(importTransactions, initial);

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-500 dark:text-gray-400">Tải file CSV</span>
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-black"
          />
        </label>
        <div className="text-center text-xs text-gray-600 dark:text-gray-500">— hoặc dán nội dung CSV —</div>
        <textarea
          name="csv"
          rows={8}
          placeholder={"date,type,amount,currency,account,to_account,category,note\n2026-06-19,Chi,50000,VND,Vietcombank,,Ăn uống,cafe"}
          className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2 font-mono text-xs"
        />
        <button
          disabled={pending}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          {pending ? "Đang import..." : "Import"}
        </button>
      </form>

      {state.done && (
        <div className="space-y-2 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4 text-sm">
          <div className="text-emerald-400">✓ Đã import {state.imported} giao dịch.</div>
          {state.skipped > 0 && <div className="text-amber-400">Bỏ qua {state.skipped} dòng lỗi:</div>}
          {state.errors.length > 0 && (
            <ul className="list-inside list-disc space-y-0.5 text-xs text-red-300">
              {state.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
