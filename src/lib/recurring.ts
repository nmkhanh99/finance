import { RecurrenceFrequency } from "@prisma/client";

/** Tính mốc kế tiếp theo tần suất. MONTHLY giữ nguyên ngày trong tháng (JS tự xử lý tràn tháng). */
export function nextOccurrence(date: Date, frequency: RecurrenceFrequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      return d;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      return d;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      return d;
    default:
      return d;
  }
}
