"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TransactionType } from "@prisma/client";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "EXPENSE") as TransactionType;
  if (!name || (type !== "INCOME" && type !== "EXPENSE")) return;

  // Tránh trùng tên trong cùng loại
  const existing = await prisma.category.findFirst({ where: { name, type } });
  if (existing) return;

  await prisma.category.create({ data: { name, type } });
  revalidatePath("/categories");
  revalidatePath("/transactions");
}

export async function renameCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await prisma.category.update({ where: { id }, data: { name } });
  revalidatePath("/categories");
  revalidatePath("/transactions");
}

/** Xoá danh mục: gỡ khỏi các giao dịch đang dùng (categoryId = null) rồi xoá, không mất giao dịch. */
export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.$transaction([
    prisma.transaction.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
    prisma.category.delete({ where: { id } }),
  ]);
  revalidatePath("/categories");
  revalidatePath("/transactions");
}
