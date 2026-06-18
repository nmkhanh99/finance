/** Định dạng tiền tệ cho UI. An toàn với mã tiền tệ không chuẩn (fallback số + mã). */
export function formatMoney(value: number | string, currency = "VND"): string {
  const n = typeof value === "string" ? Number(value) : value;
  try {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(n);
  } catch {
    return `${new Intl.NumberFormat("vi-VN").format(n)} ${currency}`;
  }
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}
