import { prisma } from "@/lib/db";
import { buildTransactionWhere, type TxFilters } from "@/lib/txFilter";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { INCOME: "Thu", EXPENSE: "Chi", TRANSFER: "Chuyển" };

/** Xuất giao dịch ra CSV theo cùng bộ lọc của trang Giao dịch. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const f: TxFilters = {
    q: sp.get("q") ?? undefined,
    type: sp.get("type") ?? undefined,
    accountId: sp.get("accountId") ?? undefined,
    categoryId: sp.get("categoryId") ?? undefined,
    month: sp.get("month") ?? undefined,
  };

  const txs = await prisma.transaction.findMany({
    where: buildTransactionWhere(f),
    orderBy: { date: "desc" },
    include: { account: true, toAccount: true, category: true },
  });

  const header = ["date", "type", "amount", "currency", "account", "to_account", "category", "note"];
  const rows = txs.map((t) => [
    t.date.toISOString().slice(0, 10),
    TYPE_LABEL[t.type] ?? t.type,
    // số tiền dạng số thô (không format) để dễ phân tích / import lại
    t.amount.toString(),
    t.account.currency,
    t.account.name,
    t.toAccount?.name ?? "",
    t.category?.name ?? "",
    t.note ?? "",
  ]);

  // BOM để Excel mở UTF-8 (tiếng Việt) đúng
  const csv = "﻿" + toCsv([header, ...rows]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
