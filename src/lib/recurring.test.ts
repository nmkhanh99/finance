import { describe, it, expect } from "vitest";
import { nextOccurrence } from "./recurring";

describe("nextOccurrence", () => {
  it("DAILY +1 ngày", () => {
    expect(nextOccurrence(new Date("2026-06-19"), "DAILY").toISOString().slice(0, 10)).toBe("2026-06-20");
  });
  it("WEEKLY +7 ngày", () => {
    expect(nextOccurrence(new Date("2026-06-19"), "WEEKLY").toISOString().slice(0, 10)).toBe("2026-06-26");
  });
  it("MONTHLY +1 tháng", () => {
    expect(nextOccurrence(new Date("2026-06-19"), "MONTHLY").toISOString().slice(0, 10)).toBe("2026-07-19");
  });
  it("không đột biến tham số gốc", () => {
    const d = new Date("2026-06-19");
    nextOccurrence(d, "MONTHLY");
    expect(d.toISOString().slice(0, 10)).toBe("2026-06-19");
  });
});
