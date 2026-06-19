import { RecurrenceFrequency } from "@prisma/client";

/** Tính mốc kế tiếp theo tần suất. MONTHLY giữ nguyên ngày trong tháng (JS tự xử lý tràn tháng). */
export function nextOccurrence(date: Date, frequency: RecurrenceFrequency): Date {
  const d = new Date(date);
  // Dùng UTC để giữ ngày-chỉ ở UTC-midnight, không lệch múi giờ (server tz bất kỳ).
  switch (frequency) {
    case "DAILY":
      d.setUTCDate(d.getUTCDate() + 1);
      return d;
    case "WEEKLY":
      d.setUTCDate(d.getUTCDate() + 7);
      return d;
    case "MONTHLY":
      d.setUTCMonth(d.getUTCMonth() + 1);
      return d;
    default:
      return d;
  }
}
