"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AccountType } from "@prisma/client";
import { requireUserId } from "@/lib/currentUser";

export async function createAccount(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "BANK") as AccountType;
  const balance = Number(formData.get("balance") ?? 0);
  const currency = (String(formData.get("currency") ?? "VND").trim().toUpperCase() || "VND").slice(0, 5);
  if (!name) return;

  await prisma.account.create({
    data: { name, type, balance, currency, userId },
  });
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function updateBalance(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const balance = Number(formData.get("balance") ?? 0);
  if (!id) return;

  await prisma.account.updateMany({ where: { id, userId }, data: { balance } });
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function deleteAccount(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.account.deleteMany({ where: { id, userId } });
  revalidatePath("/accounts");
  revalidatePath("/");
}
