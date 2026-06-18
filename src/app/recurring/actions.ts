"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma, TransactionType, RecurrenceFrequency } from "@prisma/client";
import { runDueRecurring } from "@/lib/recurringRun";

export async function createRecurring(formData: FormData) {
  const type = String(formData.get("type") ?? "EXPENSE") as TransactionType;
  const amount = Number(formData.get("amount") ?? 0);
  const accountId = String(formData.get("accountId") ?? "");
  const toAccountId = String(formData.get("toAccountId") ?? "") || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const frequency = String(formData.get("frequency") ?? "MONTHLY") as RecurrenceFrequency;
  const startStr = String(formData.get("startDate") ?? "");
  const endStr = String(formData.get("endDate") ?? "");

  if (!accountId || amount <= 0) return;
  if (type === "TRANSFER" && (!toAccountId || toAccountId === accountId)) return;

  const startDate = startStr ? new Date(startStr) : new Date();

  await prisma.recurringTransaction.create({
    data: {
      type,
      amount: new Prisma.Decimal(amount),
      accountId,
      toAccountId: type === "TRANSFER" ? toAccountId : null,
      categoryId: type === "TRANSFER" ? null : categoryId,
      note,
      frequency,
      startDate,
      nextRun: startDate,
      endDate: endStr ? new Date(endStr) : null,
    },
  });
  revalidatePath("/recurring");
}

export async function deleteRecurring(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.recurringTransaction.delete({ where: { id } });
  revalidatePath("/recurring");
}

export async function runRecurringNow() {
  await runDueRecurring();
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/");
}
