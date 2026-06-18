"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AccountType } from "@prisma/client";

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "BANK") as AccountType;
  const balance = Number(formData.get("balance") ?? 0);
  if (!name) return;

  await prisma.account.create({
    data: { name, type, balance, currency: "VND" },
  });
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function updateBalance(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const balance = Number(formData.get("balance") ?? 0);
  if (!id) return;

  await prisma.account.update({ where: { id }, data: { balance } });
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function deleteAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.account.delete({ where: { id } });
  revalidatePath("/accounts");
  revalidatePath("/");
}
