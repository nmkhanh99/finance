import { describe, it, expect } from "vitest";
import { evaluateBudget } from "./budget";

describe("evaluateBudget", () => {
  it("chưa vượt", () => {
    const r = evaluateBudget(2_000_000, 1_500_000);
    expect(r.remaining).toBe(500_000);
    expect(r.percent).toBe(75);
    expect(r.isOver).toBe(false);
  });
  it("đúng bằng hạn mức -> chưa vượt", () => {
    const r = evaluateBudget(1_000_000, 1_000_000);
    expect(r.remaining).toBe(0);
    expect(r.percent).toBe(100);
    expect(r.isOver).toBe(false);
  });
  it("vượt hạn mức", () => {
    const r = evaluateBudget(1_000_000, 1_200_000);
    expect(r.remaining).toBe(-200_000);
    expect(r.percent).toBe(120);
    expect(r.isOver).toBe(true);
  });
  it("hạn mức 0 không chia 0", () => {
    const r = evaluateBudget(0, 0);
    expect(r.percent).toBe(0);
    expect(r.isOver).toBe(false);
  });
});
