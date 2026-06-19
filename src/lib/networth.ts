import { prisma } from "./db";
import { netWorth } from "./finance";
import { convertToBase } from "./currency";
import { Prisma } from "@prisma/client";

export interface NetWorthBreakdown {
  totalCash: number;
  totalInvest: number;
  totalDebt: number;
  netWorth: number;
}

/** Tính tài sản ròng hiện tại từ tài khoản + đầu tư (giá mới nhất) − dư nợ của 1 user. */
export async function computeNetWorth(userId: string): Promise<NetWorthBreakdown> {
  const [accounts, holdings, debts, rateRows] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.holding.findMany({ where: { userId }, include: { prices: { orderBy: { at: "desc" }, take: 1 } } }),
    prisma.debt.findMany({ where: { userId }, include: { payments: true } }),
    prisma.exchangeRate.findMany(),
  ]);

  // map tỷ giá: code -> số VND/1 đơn vị
  const rates: Record<string, number> = {};
  for (const r of rateRows) rates[r.code] = Number(r.rate);

  // Mọi giá trị quy đổi về VND (base) trước khi cộng
  const accountBalances = accounts.map((a) => convertToBase(Number(a.balance), a.currency, rates));
  const holdingsForNW = holdings.map((h) => {
    const latest = h.prices[0]?.price ?? h.avgCost; // chưa có giá thị trường thì dùng giá vốn
    const valueInCcy = Number(h.quantity) * Number(latest);
    return { quantity: 1, currentPrice: convertToBase(valueInCcy, h.currency, rates) };
  });
  const debtsOutstanding = debts.map((d) => {
    const paidPrincipal = d.payments.reduce((s, p) => s + Number(p.principal), 0);
    const outstanding = Math.max(Number(d.principal) - paidPrincipal, 0);
    return convertToBase(outstanding, d.currency, rates);
  });

  const totalCash = accountBalances.reduce((s, b) => s + b, 0);
  const totalInvest = holdingsForNW.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const totalDebt = debtsOutstanding.reduce((s, d) => s + d, 0);
  const nw = netWorth({ accountBalances, holdings: holdingsForNW, debtsOutstanding });

  return { totalCash, totalInvest, totalDebt, netWorth: nw };
}

/** Ghi lại snapshot Net Worth hôm nay cho 1 user (1 bản/ngày, upsert). Trả về breakdown. */
export async function recordNetWorthSnapshot(userId: string): Promise<NetWorthBreakdown> {
  const b = await computeNetWorth(userId);
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
    where: { userId_date: { userId, date: day } },
    create: { userId, date: day, ...data },
    update: data,
  });
  return b;
}
