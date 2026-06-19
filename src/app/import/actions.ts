"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { parseCsv } from "@/lib/csvParse";
import { validateImportRows } from "@/lib/importTx";
import { validateBankRows, type BankMapping } from "@/lib/importBank";
import { applyTransaction } from "@/lib/txCore";
import { requireUserId } from "@/lib/currentUser";

export interface ImportResult {
  done: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importTransactions(
  _prev: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  const userId = await requireUserId();
  const file = formData.get("file") as File | null;
  let text = "";
  if (file && file.size > 0) text = await file.text();
  else text = String(formData.get("csv") ?? "");
  if (!text.trim()) return { done: true, imported: 0, skipped: 0, errors: ["Chưa có dữ liệu CSV."] };

  const rows = parseCsv(text);
  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({ where: { userId }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { userId }, select: { id: true, name: true } }),
  ]);

  const { valid, errors } = validateImportRows(rows, accounts, categories);

  if (valid.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const v of valid) {
        await applyTransaction(tx, { ...v, amount: new Prisma.Decimal(v.amount), userId });
      }
    });
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/");
  }

  return { done: true, imported: valid.length, skipped: errors.length, errors: errors.slice(0, 20) };
}

/** Import sao kê ngân hàng theo cấu hình map cột (gửi từ BankImportForm). */
export async function importBankStatement(
  _prev: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  const userId = await requireUserId();
  const text = String(formData.get("csv") ?? "");
  if (!text.trim()) return { done: true, imported: 0, skipped: 0, errors: ["Chưa có dữ liệu CSV."] };

  const accountId = String(formData.get("accountId") ?? "");
  const acc = await prisma.account.findFirst({ where: { id: accountId, userId }, select: { id: true } });
  if (!acc) return { done: true, imported: 0, skipped: 0, errors: ["Chưa chọn tài khoản hợp lệ."] };

  const num = (k: string) => {
    const n = Number(formData.get(k));
    return Number.isFinite(n) ? n : -1;
  };
  const amountMode = String(formData.get("amountMode") ?? "single") === "debitCredit" ? "debitCredit" : "single";
  const dateOrderRaw = String(formData.get("dateOrder") ?? "dmy");
  const mapping: BankMapping = {
    hasHeader: formData.get("hasHeader") === "on",
    accountId,
    dateCol: num("dateCol"),
    dateOrder: dateOrderRaw === "mdy" ? "mdy" : dateOrderRaw === "ymd" ? "ymd" : "dmy",
    amountMode,
    amountCol: num("amountCol"),
    debitCol: num("debitCol"),
    creditCol: num("creditCol"),
    noteCol: num("noteCol"),
  };

  if (mapping.dateCol < 0) return { done: true, imported: 0, skipped: 0, errors: ["Chưa chọn cột Ngày."] };
  if (amountMode === "single" && mapping.amountCol < 0)
    return { done: true, imported: 0, skipped: 0, errors: ["Chưa chọn cột Số tiền."] };
  if (amountMode === "debitCredit" && (mapping.debitCol < 0 || mapping.creditCol < 0))
    return { done: true, imported: 0, skipped: 0, errors: ["Chưa chọn cột Nợ và Có."] };

  const rows = parseCsv(text);
  const { valid, errors } = validateBankRows(rows, mapping);

  if (valid.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const v of valid) {
        await applyTransaction(tx, { ...v, amount: new Prisma.Decimal(v.amount), userId });
      }
    });
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/");
  }

  return { done: true, imported: valid.length, skipped: errors.length, errors: errors.slice(0, 20) };
}
