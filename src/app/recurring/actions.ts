"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma, TransactionType, RecurrenceFrequency } from "@prisma/client";
import { runDueRecurring } from "@/lib/recurringRun";
import { requireUserId } from "@/lib/currentUser";

export async function createRecurring(formData: FormData) {
  const userId = await requireUserId();
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

  // Chống IDOR: account/toAccount/category được tham chiếu phải thuộc user hiện tại
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) return;
  if (type === "TRANSFER" && toAccountId) {
    const toAccount = await prisma.account.findFirst({ where: { id: toAccountId, userId } });
    if (!toAccount) return;
  }
  if (type !== "TRANSFER" && categoryId) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
    if (!category) return;
  }

  const startDate = startStr ? new Date(startStr) : new Date();

  await prisma.recurringTransaction.create({
    data: {
      userId,
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

export async function toggleRecurring(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  await prisma.recurringTransaction.updateMany({ where: { id, userId }, data: { active } });
  revalidatePath("/recurring");
}

export async function updateRecurring(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const frequency = String(formData.get("frequency") ?? "MONTHLY") as RecurrenceFrequency;
  const note = String(formData.get("note") ?? "").trim() || null;
  const nextStr = String(formData.get("nextRun") ?? "");
  const endStr = String(formData.get("endDate") ?? "");
  if (!id || amount <= 0) return;

  await prisma.recurringTransaction.updateMany({
    where: { id, userId },
    data: {
      amount: new Prisma.Decimal(amount),
      frequency,
      note,
      ...(nextStr ? { nextRun: new Date(nextStr) } : {}),
      endDate: endStr ? new Date(endStr) : null,
    },
  });
  revalidatePath("/recurring");
}

export async function deleteRecurring(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.recurringTransaction.deleteMany({ where: { id, userId } });
  revalidatePath("/recurring");
}

export async function runRecurringNow() {
  const userId = await requireUserId();
  await runDueRecurring(new Date(), userId); // chỉ chạy recurring của user này
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/");
}
