import { prisma } from "./db";
import { TransactionType } from "@prisma/client";

/** Danh mục thu/chi mặc định cho mỗi user mới. */
export const DEFAULT_CATEGORIES: { name: string; type: TransactionType }[] = [
  { name: "Lương", type: "INCOME" },
  { name: "Thưởng", type: "INCOME" },
  { name: "Lãi đầu tư", type: "INCOME" },
  { name: "Ăn uống", type: "EXPENSE" },
  { name: "Đi lại", type: "EXPENSE" },
  { name: "Nhà ở / Hoá đơn", type: "EXPENSE" },
  { name: "Mua sắm", type: "EXPENSE" },
  { name: "Giải trí", type: "EXPENSE" },
  { name: "Sức khoẻ", type: "EXPENSE" },
  { name: "Trả nợ / Lãi vay", type: "EXPENSE" },
];

/** Seed danh mục mặc định cho 1 user (gọi khi tạo user mới). */
export async function seedDefaultCategories(userId: string): Promise<void> {
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
  });
}
