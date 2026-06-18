/** Định dạng tiền tệ cho UI. */
export function formatMoney(value: number | string, currency = "VND"): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  }
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(n);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}
