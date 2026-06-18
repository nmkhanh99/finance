import { describe, it, expect } from "vitest";
import {
  netWorth,
  unrealizedPnL,
  weightedAvgCost,
  simpleInterest,
  compoundBalance,
  amortizingMonthlyPayment,
  amortizationSchedule,
  requiredMonthlySaving,
  simulatePayoff,
  type DebtForSim,
} from "./finance";

describe("netWorth", () => {
  it("tổng tài sản − nợ", () => {
    const nw = netWorth({
      accountBalances: [10_000_000, 5_000_000], // 15tr tiền mặt+bank
      holdings: [{ quantity: 2, currentPrice: 50_000_000 }], // 100tr crypto
      debtsOutstanding: [30_000_000], // nợ 30tr
    });
    expect(nw).toBe(85_000_000);
  });

  it("rỗng = 0", () => {
    expect(netWorth({ accountBalances: [], holdings: [], debtsOutstanding: [] })).toBe(0);
  });
});

describe("unrealizedPnL", () => {
  it("lãi", () => {
    const p = unrealizedPnL(10, 120, 100); // mua 100, giờ 120
    expect(p.amount).toBe(200);
    expect(p.percent).toBe(20);
  });
  it("lỗ", () => {
    const p = unrealizedPnL(10, 80, 100);
    expect(p.amount).toBe(-200);
    expect(p.percent).toBe(-20);
  });
  it("costBasis = 0 không chia 0", () => {
    expect(unrealizedPnL(0, 100, 0).percent).toBe(0);
  });
});

describe("weightedAvgCost", () => {
  it("bình quân gia quyền", () => {
    // có 10 @ 100, mua thêm 10 @ 200 -> TB 150
    expect(weightedAvgCost(10, 100, 10, 200)).toBe(150);
  });
});

describe("lãi vay", () => {
  it("lãi đơn", () => {
    expect(simpleInterest(100_000_000, 0.1, 2)).toBe(20_000_000); // 10%/năm * 2 năm
  });
  it("lãi kép theo tháng", () => {
    // 100tr, 12%/năm ghép tháng, 1 năm ~ 112.68tr
    expect(compoundBalance(100_000_000, 0.12, 12, 1)).toBeCloseTo(112_682_503.01, 0);
  });
  it("trả góp đều PMT", () => {
    // vay 100tr, 12%/năm, 12 tháng -> ~8.884.879/tháng
    expect(amortizingMonthlyPayment(100_000_000, 0.12, 12)).toBeCloseTo(8_884_879, -1);
  });
  it("PMT lãi suất 0", () => {
    expect(amortizingMonthlyPayment(12_000_000, 0, 12)).toBe(1_000_000);
  });
});

describe("amortizationSchedule", () => {
  it("dư nợ về 0 ở kỳ cuối, tổng gốc = principal", () => {
    const rows = amortizationSchedule(100_000_000, 0.12, 12);
    expect(rows).toHaveLength(12);
    expect(rows[11].balance).toBe(0);
    const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0);
    expect(Math.round(totalPrincipal)).toBe(100_000_000);
  });
});

describe("requiredMonthlySaving", () => {
  it("không lãi chia đều", () => {
    // cần 120tr, đang có 0, trong 12 tháng -> 10tr/tháng
    expect(requiredMonthlySaving(120_000_000, 0, 12, 0)).toBe(10_000_000);
  });
  it("trừ tiền đã có", () => {
    expect(requiredMonthlySaving(120_000_000, 60_000_000, 12, 0)).toBe(5_000_000);
  });
  it("đã đủ -> 0", () => {
    expect(requiredMonthlySaving(100_000_000, 100_000_000, 12, 0.05)).toBe(0);
  });
  it("có lãi thì cần ít hơn không lãi", () => {
    const withRate = requiredMonthlySaving(120_000_000, 0, 12, 0.12);
    expect(withRate).toBeLessThan(10_000_000);
  });
});

describe("simulatePayoff avalanche vs snowball", () => {
  const debts: DebtForSim[] = [
    { id: "a", name: "Thẻ tín dụng", balance: 20_000_000, annualRate: 0.24, minPayment: 1_000_000 },
    { id: "b", name: "Vay tiêu dùng", balance: 50_000_000, annualRate: 0.15, minPayment: 2_000_000 },
    { id: "c", name: "Vay bạn bè", balance: 5_000_000, annualRate: 0.0, minPayment: 500_000 },
  ];

  it("cả hai đều trả hết", () => {
    const av = simulatePayoff(debts, 3_000_000, "avalanche");
    const sn = simulatePayoff(debts, 3_000_000, "snowball");
    expect(av.months).toBeGreaterThan(0);
    expect(sn.months).toBeGreaterThan(0);
  });

  it("avalanche tổng lãi <= snowball", () => {
    const av = simulatePayoff(debts, 3_000_000, "avalanche");
    const sn = simulatePayoff(debts, 3_000_000, "snowball");
    expect(av.totalInterest).toBeLessThanOrEqual(sn.totalInterest);
  });
});
