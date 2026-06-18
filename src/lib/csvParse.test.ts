import { describe, it, expect } from "vitest";
import { parseCsv } from "./csvParse";
import { toCsv } from "./csv";

describe("parseCsv", () => {
  it("cơ bản", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });
  it("ô có dấu phẩy trong nháy kép", () => {
    expect(parseCsv('x,"a,b",y')).toEqual([["x", "a,b", "y"]]);
  });
  it("nháy kép escaped", () => {
    expect(parseCsv('"say ""hi"""')).toEqual([['say "hi"']]);
  });
  it("CRLF + BOM", () => {
    expect(parseCsv("﻿a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
  it("bỏ dòng rỗng", () => {
    expect(parseCsv("a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
  it("round-trip với toCsv", () => {
    const rows = [
      ["date", "note"],
      ["2026-06-19", "cafe, sáng"],
      ["2026-06-20", 'say "hi"'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
