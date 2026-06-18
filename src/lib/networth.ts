import { prisma } from "./db";
import { netWorth } from "./finance";
import { Prisma } from "@prisma/client";

export interface NetWorthBreakdown {
  totalCash: number;
  totalInvest: number;
  totalDebt: number;
  netWorth: number;
}

/** Tính tài sản ròng hiện tại từ tài khoản + đầu tư (giá mới nhất) − dư nợ. */
export async function computeNetWorth(): Promise<NetWorthBreakdown> {
  const [accounts, holdings, debts] = await Promise.all([
    prisma.account.findMany(),
    prisma.holding.findMany({ include: { prices: { orderBy: { at: "desc" }, take: 1 } } }),
    prisma.debt.findMany({ include: { payments: true } }),
  ]);

  const accountBalances = accounts.map((a) => Number(a.balance));
  const holdingsForNW = holdings.map((h) => {
    const latest = h.prices[0]?.price ?? h.avgCost; // chưa có giá thị trường thì dùng giá vốn
    return { quantity: Number(h.quantity), currentPrice: Number(latest) };
  });
  const debtsOutstanding = debts.map((d) => {
    const paidPrincipal = d.payments.reduce((s, p) => s + Number(p.principal), 0);
    return Math.max(Number(d.principal) - paidPrincipal, 0);
  });

  const totalCash = accountBalances.reduce((s, b) => s + b, 0);
  const totalInvest = holdingsForNW.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const totalDebt = debtsOutstanding.reduce((s, d) => s + d, 0);
  const nw = netWorth({ accountBalances, holdings: holdingsForNW, debtsOutstanding });

  return { totalCash, totalInvest, totalDebt, netWorth: nw };
}

/** Ghi lại snapshot Net Worth cho hôm nay (1 bản/ngày, upsert). Trả về breakdown. */
export async function recordNetWorthSnapshot(): Promise<NetWorthBreakdown> {
  const b = await computeNetWorth();
  const now = new Date();
  // UTC midnight để cột @db.Date lưu đúng ngày, không bị lệch múi giờ
  const day = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const data = {
    totalCash: new Prisma.Decimal(b.totalCash),
    totalInvest: new Prisma.Decimal(b.totalInvest),
    totalDebt: new Prisma.Decimal(b.totalDebt),
    netWorth: new Prisma.Decimal(b.netWorth),
  };
  await prisma.netWorthSnapshot.upsert({
    where: { date: day },
    create: { date: day, ...data },
    update: data,
  });
  return b;
}
