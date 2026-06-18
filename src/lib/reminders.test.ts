import { describe, it, expect } from "vitest";
import { addMonths, daysBetween, dueStatus } from "./reminders";

describe("addMonths", () => {
  it("cộng tháng", () => {
    expect(addMonths(new Date("2026-01-15"), 3).toISOString().slice(0, 10)).toBe("2026-04-15");
  });
});

describe("daysBetween", () => {
  it("dương khi tương lai", () => {
    expect(daysBetween(new Date("2026-06-19"), new Date("2026-06-29"))).toBe(10);
  });
  it("âm khi quá khứ", () => {
    expect(daysBetween(new Date("2026-06-19"), new Date("2026-06-09"))).toBe(-10);
  });
});

describe("dueStatus", () => {
  const now = new Date("2026-06-19T00:00:00Z");
  it("quá hạn", () => {
    expect(dueStatus(new Date("2026-06-01T00:00:00Z"), now)).toBe("overdue");
  });
  it("sắp tới (trong 30 ngày)", () => {
    expect(dueStatus(new Date("2026-07-10T00:00:00Z"), now)).toBe("soon");
  });
  it("còn xa", () => {
    expect(dueStatus(new Date("2026-12-01T00:00:00Z"), now)).toBe("upcoming");
  });
});
