/** Tiện ích ngày cho nhắc nhở (đáo hạn nợ, mục tiêu). Thuần, dễ test. */

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

/** Số ngày từ `from` đến `to` (làm tròn lên). Âm nếu `to` đã qua. */
export function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export type DueStatus = "overdue" | "soon" | "upcoming";

/** Trạng thái đến hạn: quá hạn / sắp tới (trong soonDays) / còn xa. */
export function dueStatus(due: Date, now: Date, soonDays = 30): DueStatus {
  const days = daysBetween(now, due);
  if (days < 0) return "overdue";
  if (days <= soonDays) return "soon";
  return "upcoming";
}

export interface ReminderItem {
  label: string;
  due: Date;
  days: number; // số ngày còn lại (âm = quá hạn)
  status: "overdue" | "soon";
  href: string;
}

// Chấp nhận cả Prisma.Decimal (có toString) lẫn number/string — dùng Number() để quy ra số.
type Numeric = number | string | { toString(): string };

interface DebtLike {
  name: string;
  principal: Numeric;
  startDate: Date;
  termMonths: number;
  payments: { principal: Numeric }[];
}
interface GoalLike {
  name: string;
  currentSaved: Numeric;
  targetAmount: Numeric;
  targetDate: Date;
}

/**
 * Danh sách nhắc nhở đến hạn: nợ còn dư sắp đáo hạn + mục tiêu chưa đạt sắp đến hạn
 * (quá hạn hoặc trong `soonDays` ngày). Dùng chung cho Dashboard & email nhắc.
 */
export function buildReminders(debts: DebtLike[], goals: GoalLike[], now: Date, soonDays = 30): ReminderItem[] {
  const out: ReminderItem[] = [];
  for (const d of debts) {
    const paid = d.payments.reduce((s, p) => s + Number(p.principal), 0);
    if (Number(d.principal) - paid <= 0) continue; // đã trả hết
    const due = addMonths(d.startDate, d.termMonths);
    const st = dueStatus(due, now, soonDays);
    if (st !== "upcoming") out.push({ label: `Nợ "${d.name}" đáo hạn`, due, days: daysBetween(now, due), status: st, href: "/debts" });
  }
  for (const g of goals) {
    if (Number(g.currentSaved) >= Number(g.targetAmount)) continue; // đã đạt
    const st = dueStatus(g.targetDate, now, soonDays);
    if (st !== "upcoming") out.push({ label: `Mục tiêu "${g.name}"`, due: g.targetDate, days: daysBetween(now, g.targetDate), status: st, href: "/goals" });
  }
  out.sort((a, b) => a.due.getTime() - b.due.getTime());
  return out;
}
