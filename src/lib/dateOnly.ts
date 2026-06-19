/**
 * Tiện ích ngày-chỉ (date-only): chuẩn hoá về UTC-midnight để khớp cột Prisma `@db.Date`,
 * tránh lệch múi giờ (+7h ở VN). Mọi ngày người dùng nhập/lọc đều qua đây.
 */

/** UTC-midnight của hôm nay (theo thời điểm `now`). */
export function utcToday(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** "YYYY-MM-DD" -> Date tại UTC-midnight. Rỗng/không hợp lệ -> hôm nay (UTC). */
export function parseDateInput(s?: string | null): Date {
  if (s && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s.slice(0, 10) + "T00:00:00.000Z");
    if (!Number.isNaN(d.getTime())) return d;
  }
  return utcToday();
}

/** UTC-midnight ngày 1 của tháng = tháng-của-`now` + `offsetMonths`. Dùng cho mốc lọc tháng. */
export function monthStartUTC(now: Date, offsetMonths = 0): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth() + offsetMonths, 1));
}
