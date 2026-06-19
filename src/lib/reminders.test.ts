import { describe, it, expect } from "vitest";
import { addMonths, daysBetween, dueStatus, buildReminders } from "./reminders";

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

describe("buildReminders", () => {
  const now = new Date("2026-06-19T00:00:00Z");
  const debtSoon = { name: "Vay A", principal: 10_000_000, startDate: new Date("2025-07-01"), termMonths: 12, payments: [] }; // đáo hạn 2026-07-01 -> soon
  const debtPaid = { name: "Vay B", principal: 5_000_000, startDate: new Date("2025-07-01"), termMonths: 12, payments: [{ principal: 5_000_000 }] }; // đã trả hết
  const goalFar = { name: "Mua xe", currentSaved: 0, targetAmount: 100_000_000, targetDate: new Date("2026-12-31") }; // còn xa
  const goalDone = { name: "Quỹ", currentSaved: 50, targetAmount: 50, targetDate: new Date("2026-06-25") }; // đã đạt

  it("gồm nợ còn dư sắp đáo hạn, loại nợ đã trả hết", () => {
    const r = buildReminders([debtSoon, debtPaid], [], now);
    expect(r).toHaveLength(1);
    expect(r[0].label).toContain("Vay A");
    expect(r[0].status).toBe("soon");
  });

  it("loại mục tiêu còn xa & mục tiêu đã đạt", () => {
    expect(buildReminders([], [goalFar, goalDone], now)).toHaveLength(0);
  });

  it("sắp xếp theo hạn tăng dần", () => {
    const goalSoon = { name: "Du lịch", currentSaved: 0, targetAmount: 1, targetDate: new Date("2026-06-25") };
    const r = buildReminders([debtSoon], [goalSoon], now);
    expect(r.map((x) => x.due.getTime())).toEqual([...r.map((x) => x.due.getTime())].sort((a, b) => a - b));
  });
});
