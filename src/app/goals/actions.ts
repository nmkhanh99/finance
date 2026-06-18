"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function createGoal(formData: FormData) {
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
      targetDate: new Date(targetStr),
      currency: "VND",
    },
  });
  revalidatePath("/goals");
}

export async function updateSaved(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const currentSaved = Number(formData.get("currentSaved") ?? 0);
  if (!id) return;
  await prisma.goal.update({
    where: { id },
    data: { currentSaved: new Prisma.Decimal(currentSaved) },
  });
  revalidatePath("/goals");
}

export async function deleteGoal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.goal.delete({ where: { id } });
  revalidatePath("/goals");
}
