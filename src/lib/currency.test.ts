import { describe, it, expect } from "vitest";
import { convertToBase } from "./currency";

const rates = { USD: 25000 };

describe("convertToBase", () => {
  it("VND giữ nguyên", () => {
    expect(convertToBase(1000, "VND", rates)).toBe(1000);
  });
  it("USD -> VND theo tỷ giá", () => {
    expect(convertToBase(10, "USD", rates)).toBe(250000);
  });
  it("thiếu tỷ giá -> giữ nguyên", () => {
    expect(convertToBase(10, "EUR", rates)).toBe(10);
  });
});
