"use client";

import { useActionState, useMemo, useState } from "react";
import { parseCsv } from "@/lib/csvParse";
import { importBankStatement, type ImportResult } from "./actions";

interface Account {
  id: string;
  name: string;
}

const initial: ImportResult = { done: false, imported: 0, skipped: 0, errors: [] };

const SELECT_CLS =
  "rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-2 py-1.5 text-sm";

export default function BankImportForm({ accounts }: { accounts: Account[] }) {
  const [state, action, pending] = useActionState(importBankStatement, initial);
  const [csvText, setCsvText] = useState("");
  const [hasHeader, setHasHeader] = useState(true);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [dateCol, setDateCol] = useState("-1");
  const [dateOrder, setDateOrder] = useState("dmy");
  const [amountMode, setAmountMode] = useState("single");
  const [amountCol, setAmountCol] = useState("-1");
  const [debitCol, setDebitCol] = useState("-1");
  const [creditCol, setCreditCol] = useState("-1");
  const [noteCol, setNoteCol] = useState("-1");

  const rows = useMemo(() => (csvText.trim() ? parseCsv(csvText) : []), [csvText]);
  const columns: string[] = useMemo(() => {
    if (rows.length === 0) return [];
    const width = Math.max(...rows.map((r) => r.length));
    if (hasHeader) return rows[0].map((c, i) => c.trim() || `Cột ${i + 1}`);
    return Array.from({ length: width }, (_, i) => `Cột ${i + 1}`);
  }, [rows, hasHeader]);
  const preview = useMemo(() => (hasHeader ? rows.slice(1, 4) : rows.slice(0, 3)), [rows, hasHeader]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setCsvText(await f.text());
  }

  const colSelect = (value: string, set: (v: string) => void, name: string, allowNone = false) => (
    <select name={name} value={value} onChange={(e) => set(e.target.value)} className={SELECT_CLS}>
      <option value="-1">{allowNone ? "— Không map —" : "— Chọn cột —"}</option>
      {columns.map((c, i) => (
        <option key={i} value={String(i)}>{c}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-4">
      <label className="flex flex-col text-sm">
        <span className="mb-1 text-gray-500 dark:text-gray-400">Tải file sao kê (.csv)</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-black"
        />
      </label>
      <div className="text-center text-xs text-gray-600 dark:text-gray-500">— hoặc dán nội dung CSV —</div>
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={6}
        placeholder={"Ngày,Số tiền,Số dư,Nội dung\n19/06/2026,-500.000,9.500.000,Cà phê"}
        className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2 font-mono text-xs"
      />

      {columns.length > 0 && (
        <form action={action} className="space-y-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-4">
          <input type="hidden" name="csv" value={csvText} />
          {hasHeader && <input type="hidden" name="hasHeader" value="on" />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-500 dark:text-gray-400">Nạp vào tài khoản</span>
              <select name="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} className={SELECT_CLS}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm sm:mt-6">
              <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
              Dòng đầu là tiêu đề
            </label>

            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-500 dark:text-gray-400">Cột Ngày</span>
              {colSelect(dateCol, setDateCol, "dateCol")}
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-500 dark:text-gray-400">Định dạng ngày</span>
              <select name="dateOrder" value={dateOrder} onChange={(e) => setDateOrder(e.target.value)} className={SELECT_CLS}>
                <option value="dmy">DD/MM/YYYY</option>
                <option value="mdy">MM/DD/YYYY</option>
                <option value="ymd">YYYY-MM-DD</option>
              </select>
            </label>

            <label className="flex flex-col text-sm sm:col-span-2">
              <span className="mb-1 text-gray-500 dark:text-gray-400">Kiểu số tiền</span>
              <select name="amountMode" value={amountMode} onChange={(e) => setAmountMode(e.target.value)} className={SELECT_CLS}>
                <option value="single">Một cột (số âm = chi, dương = thu)</option>
                <option value="debitCredit">Hai cột Nợ / Có</option>
              </select>
            </label>

            {amountMode === "single" ? (
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-gray-500 dark:text-gray-400">Cột Số tiền</span>
                {colSelect(amountCol, setAmountCol, "amountCol")}
              </label>
            ) : (
              <>
                <label className="flex flex-col text-sm">
                  <span className="mb-1 text-gray-500 dark:text-gray-400">Cột Nợ (chi)</span>
                  {colSelect(debitCol, setDebitCol, "debitCol")}
                </label>
                <label className="flex flex-col text-sm">
                  <span className="mb-1 text-gray-500 dark:text-gray-400">Cột Có (thu)</span>
                  {colSelect(creditCol, setCreditCol, "creditCol")}
                </label>
              </>
            )}

            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-500 dark:text-gray-400">Cột Nội dung (tùy chọn)</span>
              {colSelect(noteCol, setNoteCol, "noteCol", true)}
            </label>
          </div>

          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
              <table className="w-full text-xs">
                <thead className="text-left text-gray-500 dark:text-gray-400">
                  <tr className="border-b border-black/10 dark:border-white/10">
                    {columns.map((c, i) => (
                      <th key={i} className="px-2 py-1">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, ri) => (
                    <tr key={ri} className="border-b border-black/5 dark:border-white/5">
                      {columns.map((_, ci) => (
                        <td key={ci} className="px-2 py-1">{r[ci] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            disabled={pending}
            className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
          >
            {pending ? "Đang import..." : "Import sao kê"}
          </button>
        </form>
      )}

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
