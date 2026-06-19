"use client";

import { useState } from "react";
import ImportForm from "./ImportForm";
import BankImportForm from "./BankImportForm";

export default function ImportTabs({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [tab, setTab] = useState<"bank" | "app">("bank");
  const cls = (on: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm ${on ? "bg-emerald-500 text-black" : "border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab("bank")} className={cls(tab === "bank")}>Sao kê ngân hàng (map cột)</button>
        <button onClick={() => setTab("app")} className={cls(tab === "app")}>Định dạng app</button>
      </div>
      {tab === "bank" ? (
        accounts.length > 0 ? (
          <BankImportForm accounts={accounts} />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Hãy tạo ít nhất 1 tài khoản trước khi import sao kê.</p>
        )
      ) : (
        <ImportForm />
      )}
    </div>
  );
}
