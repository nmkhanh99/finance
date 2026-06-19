"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DebtInterestType, Prisma } from "@prisma/client";
import { requireUserId } from "@/lib/currentUser";

export async function createDebt(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const principal = Number(formData.get("principal") ?? 0);
  const ratePercent = Number(formData.get("ratePercent") ?? 0); // người dùng nhập %/năm
  const interestType = String(formData.get("interestType") ?? "AMORTIZING") as DebtInterestType;
  const termMonths = Number(formData.get("termMonths") ?? 0);
  const startStr = String(formData.get("startDate") ?? "");
  if (!name || principal <= 0 || termMonths <= 0) return;

  await prisma.debt.create({
    data: {
      name,
      principal: new Prisma.Decimal(principal),
      interestRate: new Prisma.Decimal(ratePercent / 100),
      interestType,
      termMonths,
      startDate: startStr ? new Date(startStr) : new Date(),
      currency: "VND",
      userId,
    },
  });
  revalidatePath("/debts");
  revalidatePath("/");
}

/** Ghi nhận 1 lần trả nợ; tự tách phần lãi (theo dư nợ) và phần gốc. */
export async function addPayment(formData: FormData) {
  const userId = await requireUserId();
  const debtId = String(formData.get("debtId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const dateStr = String(formData.get("date") ?? "");
  if (!debtId || amount <= 0) return;

  // Xác minh debt thuộc user hiện tại trước khi ghi nhận trả nợ (chống IDOR).
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, userId },
    include: { payments: true },
  });
  if (!debt) return;

  const paidPrincipal = debt.payments.reduce((s, p) => s + Number(p.principal), 0);
  const outstanding = Math.max(Number(debt.principal) - paidPrincipal, 0);
  const monthlyRate = Number(debt.interestRate) / 12;

  const interest = Math.min(outstanding * monthlyRate, amount);
  const principal = Math.min(amount - interest, outstanding);

  await prisma.debtPayment.create({
    data: {
      debtId,
      amount: new Prisma.Decimal(amount),
      principal: new Prisma.Decimal(principal),
      interest: new Prisma.Decimal(interest),
      date: dateStr ? new Date(dateStr) : new Date(),
    },
  });
  revalidatePath("/debts");
  revalidatePath("/");
}

export async function deleteDebt(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.debt.deleteMany({ where: { id, userId } });
  revalidatePath("/debts");
  revalidatePath("/");
}
