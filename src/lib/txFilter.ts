import { Prisma, TransactionType } from "@prisma/client";

export interface TxFilters {
  q?: string;
  type?: string;
  accountId?: string;
  categoryId?: string;
  month?: string; // YYYY-MM
}

/** Dựng điều kiện lọc giao dịch dùng chung cho trang danh sách và export CSV. */
export function buildTransactionWhere(f: TxFilters): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};
  if (f.q?.trim()) where.note = { contains: f.q.trim(), mode: "insensitive" };
  if (f.type === "INCOME" || f.type === "EXPENSE" || f.type === "TRANSFER") {
    where.type = f.type as TransactionType;
  }
  if (f.accountId) where.OR = [{ accountId: f.accountId }, { toAccountId: f.accountId }];
  if (f.categoryId) where.categoryId = f.categoryId;
  if (f.month && /^\d{4}-\d{2}$/.test(f.month)) {
    const [y, m] = f.month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }
  return where;
}
