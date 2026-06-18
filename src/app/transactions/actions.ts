"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TransactionType } from "@prisma/client";
import { applyTransaction } from "@/lib/txCore";

export async function createTransaction(formData: FormData) {
  const type = String(formData.get("type") ?? "EXPENSE") as TransactionType;
  const amount = Number(formData.get("amount") ?? 0);
  const accountId = String(formData.get("accountId") ?? "");
  const toAccountId = String(formData.get("toAccountId") ?? "") || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const dateStr = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!accountId || amount <= 0) return;
  if (type === "TRANSFER" && (!toAccountId || toAccountId === accountId)) return;

  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.$transaction((tx) =>
    applyTransaction(tx, { type, amount, date, note, accountId, toAccountId, categoryId }),
  );

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/");
}

/** Xoá giao dịch và hoàn lại số dư đã ảnh hưởng. */
export async function deleteTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.findUnique({ where: { id } });
    if (!t) return;
    const amt = t.amount;

    if (t.type === "INCOME") {
      await tx.account.update({ where: { id: t.accountId }, data: { balance: { decrement: amt } } });
    } else if (t.type === "EXPENSE") {
      await tx.account.update({ where: { id: t.accountId }, data: { balance: { increment: amt } } });
    } else if (t.toAccountId) {
      await tx.account.update({ where: { id: t.accountId }, data: { balance: { increment: amt } } });
      await tx.account.update({ where: { id: t.toAccountId }, data: { balance: { decrement: amt } } });
    }
    await tx.transaction.delete({ where: { id } });
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/");
}
