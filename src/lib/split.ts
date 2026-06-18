/**
 * Logic chia tiền nhóm & lên phương án thanh toán.
 * Tiền tính bằng number (VND); làm tròn về đồng để tổng luôn khớp tuyệt đối.
 */

/** Chia đều `total` cho `n` người; phần lẻ dồn cho những người đầu để Σ = total. */
export function equalSplit(total: number, n: number): number[] {
  if (n <= 0) return [];
  const units = Math.round(total); // VND không có phần lẻ
  const base = Math.floor(units / n);
  const rem = units - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

export interface Balance {
  id: string;
  name: string;
  paid: number; // tổng đã trả hộ nhóm
  owed: number; // tổng phải chịu
  net: number; // paid - owed (>0: nhóm nợ mình; <0: mình nợ nhóm)
}

export interface Transfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

/**
 * Lên phương án chuyển tiền tối thiểu để cân bằng: ghép người nợ nhiều nhất với
 * người được nợ nhiều nhất (greedy). Trả danh sách "ai chuyển cho ai bao nhiêu".
 */
export function settle(balances: Balance[]): Transfer[] {
  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ id: b.id, name: b.name, rem: Math.round(b.net) }))
    .sort((a, b) => b.rem - a.rem);
  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ id: b.id, name: b.name, rem: Math.round(-b.net) }))
    .sort((a, b) => b.rem - a.rem);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amt = Math.min(d.rem, c.rem);
    if (amt > 0) {
      transfers.push({ fromId: d.id, fromName: d.name, toId: c.id, toName: c.name, amount: amt });
    }
    d.rem -= amt;
    c.rem -= amt;
    if (d.rem <= 0) i++;
    if (c.rem <= 0) j++;
  }
  return transfers;
}
