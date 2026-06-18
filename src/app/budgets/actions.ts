"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

/** Đặt / cập nhật hạn mức cho 1 danh mục (upsert theo categoryId). limit <= 0 -> xoá ngân sách. */
export async function setBudget(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "");
  const limit = Number(formData.get("limitAmount") ?? 0) || 0;
  if (!categoryId) return;

  if (limit <= 0) {
    await prisma.budget.deleteMany({ where: { categoryId } });
  } else {
    await prisma.budget.upsert({
      where: { categoryId },
      create: { categoryId, limitAmount: new Prisma.Decimal(limit) },
      update: { limitAmount: new Prisma.Decimal(limit) },
    });
  }
  revalidatePath("/budgets");
  revalidatePath("/");
}
