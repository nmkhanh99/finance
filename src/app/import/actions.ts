"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { parseCsv } from "@/lib/csvParse";
import { validateImportRows } from "@/lib/importTx";
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
