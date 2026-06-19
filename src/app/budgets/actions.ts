"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireUserId } from "@/lib/currentUser";

/** Đặt / cập nhật hạn mức cho 1 danh mục (upsert theo categoryId). limit <= 0 -> xoá ngân sách. */
export async function setBudget(formData: FormData) {
  const userId = await requireUserId();
  const categoryId = String(formData.get("categoryId") ?? "");
  const limit = Number(formData.get("limitAmount") ?? 0) || 0;
  if (!categoryId) return;

  // Xác minh danh mục thuộc user hiện tại trước khi đặt/xoá ngân sách (chống IDOR).
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) return;

  if (limit <= 0) {
    await prisma.budget.deleteMany({ where: { categoryId, userId } });
  } else {
    await prisma.budget.upsert({
      where: { categoryId },
      create: { categoryId, limitAmount: new Prisma.Decimal(limit), userId },
      update: { limitAmount: new Prisma.Decimal(limit) },
    });
  }
  revalidatePath("/budgets");
  revalidatePath("/");
}
