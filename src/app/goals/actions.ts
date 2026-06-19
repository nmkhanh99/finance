"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { parseDateInput } from "@/lib/dateOnly";
import { requireUserId } from "@/lib/currentUser";

export async function createGoal(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = Number(formData.get("targetAmount") ?? 0);
  const currentSaved = Number(formData.get("currentSaved") ?? 0);
  const targetStr = String(formData.get("targetDate") ?? "");
  if (!name || targetAmount <= 0 || !targetStr) return;

  await prisma.goal.create({
    data: {
      name,
      targetAmount: new Prisma.Decimal(targetAmount),
      currentSaved: new Prisma.Decimal(currentSaved),
      targetDate: parseDateInput(targetStr),
      currency: "VND",
      userId,
    },
  });
  revalidatePath("/goals");
}

export async function updateSaved(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const currentSaved = Number(formData.get("currentSaved") ?? 0);
  if (!id) return;
  await prisma.goal.updateMany({
    where: { id, userId },
    data: { currentSaved: new Prisma.Decimal(currentSaved) },
  });
  revalidatePath("/goals");
}

export async function deleteGoal(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.goal.deleteMany({ where: { id, userId } });
  revalidatePath("/goals");
}
