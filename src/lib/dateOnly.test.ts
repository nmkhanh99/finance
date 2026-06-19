import { describe, it, expect } from "vitest";
import { utcToday, parseDateInput, monthStartUTC } from "./dateOnly";

describe("parseDateInput", () => {
  it("'YYYY-MM-DD' -> UTC midnight đúng ngày (không lệch)", () => {
    const d = parseDateInput("2026-06-19");
    expect(d.toISOString()).toBe("2026-06-19T00:00:00.000Z");
    expect(d.getUTCDate()).toBe(19);
  });
  it("bỏ phần giờ nếu có", () => {
    expect(parseDateInput("2026-06-19T15:30").toISOString()).toBe("2026-06-19T00:00:00.000Z");
  });
  it("rỗng/không hợp lệ -> hôm nay UTC-midnight (giờ = 0)", () => {
    const d = parseDateInput("");
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
  });
});

describe("utcToday", () => {
  it("luôn về 00:00:00 UTC", () => {
    const d = utcToday(new Date("2026-06-19T23:59:00+07:00"));
    expect(d.getUTCHours()).toBe(0);
  });
});

describe("monthStartUTC", () => {
  it("đầu tháng hiện tại tại UTC-midnight", () => {
    const now = new Date("2026-06-19T10:00:00Z");
    expect(monthStartUTC(now).toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });
  it("offset tháng (âm/dương) đúng", () => {
    const now = new Date("2026-06-19T10:00:00Z");
    expect(monthStartUTC(now, 1).toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(monthStartUTC(now, -5).toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
