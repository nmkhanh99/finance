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
