import { describe, it, expect } from "vitest";
import { equalSplit, settle, type Balance } from "./split";

describe("equalSplit", () => {
  it("chia hết", () => {
    expect(equalSplit(300000, 3)).toEqual([100000, 100000, 100000]);
  });
  it("phần lẻ dồn cho người đầu, tổng vẫn khớp", () => {
    const r = equalSplit(100000, 3); // 100000/3 = 33333.3
    expect(r.reduce((s, x) => s + x, 0)).toBe(100000);
    expect(r).toEqual([33334, 33333, 33333]);
  });
  it("n=0 -> rỗng", () => {
    expect(equalSplit(100, 0)).toEqual([]);
  });
});

describe("settle", () => {
  it("phương án chuyển tiền cân bằng hết net", () => {
    // A trả 300k cho 3 người (mỗi người 100k) -> A net +200, B -100, C -100
    const balances: Balance[] = [
      { id: "A", name: "A", paid: 300000, owed: 100000, net: 200000 },
      { id: "B", name: "B", paid: 0, owed: 100000, net: -100000 },
      { id: "C", name: "C", paid: 0, owed: 100000, net: -100000 },
    ];
    const t = settle(balances);
    // B và C mỗi người chuyển 100k cho A
    expect(t).toHaveLength(2);
    expect(t.every((x) => x.toId === "A")).toBe(true);
    expect(t.reduce((s, x) => s + x.amount, 0)).toBe(200000);
  });

  it("tổng chuyển = tổng nợ; không ai dư", () => {
    const balances: Balance[] = [
      { id: "A", name: "A", paid: 500000, owed: 200000, net: 300000 },
      { id: "B", name: "B", paid: 100000, owed: 200000, net: -100000 },
      { id: "C", name: "C", paid: 0, owed: 200000, net: -200000 },
    ];
    const t = settle(balances);
    const totalDebt = balances.filter((b) => b.net < 0).reduce((s, b) => s - b.net, 0);
    expect(t.reduce((s, x) => s + x.amount, 0)).toBe(totalDebt);
  });

  it("đã cân bằng -> không cần chuyển", () => {
    const balances: Balance[] = [
      { id: "A", name: "A", paid: 100000, owed: 100000, net: 0 },
      { id: "B", name: "B", paid: 100000, owed: 100000, net: 0 },
    ];
    expect(settle(balances)).toEqual([]);
  });
});
