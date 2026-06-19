"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TransactionType } from "@prisma/client";
import { requireUserId } from "@/lib/currentUser";

export async function createCategory(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "EXPENSE") as TransactionType;
  if (!name || (type !== "INCOME" && type !== "EXPENSE")) return;

  // Tránh trùng tên trong cùng loại
  const existing = await prisma.category.findFirst({ where: { name, type, userId } });
  if (existing) return;

  await prisma.category.create({ data: { name, type, userId } });
  revalidatePath("/categories");
  revalidatePath("/transactions");
}

export async function renameCategory(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await prisma.category.updateMany({ where: { id, userId }, data: { name } });
  revalidatePath("/categories");
  revalidatePath("/transactions");
}

/** Xoá danh mục: gỡ khỏi các giao dịch đang dùng (categoryId = null) rồi xoá, không mất giao dịch. */
export async function deleteCategory(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // Xác minh danh mục thuộc về user trước khi gỡ khỏi giao dịch & xoá (chống IDOR).
  const owned = await prisma.category.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) return;
  await prisma.$transaction([
    prisma.transaction.updateMany({ where: { categoryId: id, userId }, data: { categoryId: null } }),
    prisma.category.delete({ where: { id } }),
  ]);
  revalidatePath("/categories");
  revalidatePath("/transactions");
}
