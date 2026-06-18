export const BASE_CURRENCY = "VND";

/**
 * Quy đổi `amount` từ `currency` về tiền tệ gốc (VND).
 * rates: map code -> số VND cho 1 đơn vị. Thiếu tỷ giá -> giữ nguyên (an toàn, coi như base).
 */
export function convertToBase(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === BASE_CURRENCY) return amount;
  const r = rates[currency];
  return r && r > 0 ? amount * r : amount;
}
