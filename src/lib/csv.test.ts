import { describe, it, expect } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("giá trị thường không đổi", () => {
    expect(csvCell("abc")).toBe("abc");
    expect(csvCell(123)).toBe("123");
  });
  it("escape dấu phẩy", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
  });
  it("escape nháy kép (nhân đôi)", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });
  it("escape xuống dòng", () => {
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });
  it("null/undefined -> rỗng", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  it("ghép hàng bằng CRLF, ô bằng phẩy", () => {
    const csv = toCsv([
      ["date", "amount", "note"],
      ["2026-06-19", 50000, "cafe, sáng"],
    ]);
    expect(csv).toBe('date,amount,note\r\n2026-06-19,50000,"cafe, sáng"');
  });
});
