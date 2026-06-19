import { Prisma, TransactionType } from "@prisma/client";

export interface NewTransaction {
  type: TransactionType;
  amount: Prisma.Decimal | number;
  date: Date;
  note?: string | null;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  userId: string;
}

/**
 * Tạo 1 giao dịch và cập nhật số dư tài khoản tương ứng — dùng chung cho
 * nhập tay (createTransaction) và sinh định kỳ (recurring). Phải gọi trong một
 * `prisma.$transaction(async (tx) => ...)` để đảm bảo nguyên tử.
 */
export async function applyTransaction(tx: Prisma.TransactionClient, d: NewTransaction) {
  const amt = d.amount instanceof Prisma.Decimal ? d.amount : new Prisma.Decimal(d.amount);
  const isTransfer = d.type === "TRANSFER";

  await tx.transaction.create({
    data: {
      type: d.type,
      amount: amt,
      date: d.date,
      note: d.note ?? null,
      accountId: d.accountId,
      toAccountId: isTransfer ? d.toAccountId ?? null : null,
      categoryId: isTransfer ? null : d.categoryId ?? null,
      userId: d.userId,
    },
  });

  if (d.type === "INCOME") {
    await tx.account.update({ where: { id: d.accountId }, data: { balance: { increment: amt } } });
  } else if (d.type === "EXPENSE") {
    await tx.account.update({ where: { id: d.accountId }, data: { balance: { decrement: amt } } });
  } else {
    await tx.account.update({ where: { id: d.accountId }, data: { balance: { decrement: amt } } });
    if (d.toAccountId) {
      await tx.account.update({ where: { id: d.toAccountId }, data: { balance: { increment: amt } } });
    }
  }
}
