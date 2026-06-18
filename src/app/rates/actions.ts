"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { refreshFxRates } from "@/lib/fxRates";

export async function setRate(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const rate = Number(formData.get("rate") ?? 0);
  if (!/^[A-Z]{2,5}$/.test(code) || rate <= 0) return;
  if (code === "VND") return; // VND luôn = 1

  await prisma.exchangeRate.upsert({
    where: { code },
    create: { code, rate: new Prisma.Decimal(rate) },
    update: { rate: new Prisma.Decimal(rate) },
  });
  revalidatePath("/rates");
  revalidatePath("/");
}

export async function refreshRates() {
  await refreshFxRates();
  revalidatePath("/rates");
  revalidatePath("/");
}

export async function deleteRate(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  if (!code || code === "VND") return;
  await prisma.exchangeRate.delete({ where: { code } });
  revalidatePath("/rates");
  revalidatePath("/");
}
