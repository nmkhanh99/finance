import { describe, it, expect } from "vitest";
import { parseAmount, parseFlexibleDate, validateBankRows, type BankMapping } from "./importBank";

describe("parseAmount", () => {
  it("phân tách nghìn kiểu VN/US", () => {
    expect(parseAmount("1.000.000")).toBe(1000000); // dot = nghìn
    expect(parseAmount("1,000,000")).toBe(1000000); // comma = nghìn
    expect(parseAmount("50000 đ")).toBe(50000);
    expect(parseAmount("1,000,000.50")).toBe(1000000.5); // dot thập phân
    expect(parseAmount("1.000.000,50")).toBe(1000000.5); // comma thập phân (EU)
  });
  it("thập phân ngắn", () => {
    expect(parseAmount("500.50")).toBe(500.5);
    expect(parseAmount("1,50")).toBe(1.5);
  });
  it("âm: dấu trừ hoặc ngoặc", () => {
    expect(parseAmount("-500.000")).toBe(-500000);
    expect(parseAmount("(500,000)")).toBe(-500000);
  });
  it("rỗng/không hợp lệ -> null", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("parseFlexibleDate", () => {
  it("DD/MM/YYYY (mặc định dmy) -> UTC midnight", () => {
    expect(parseFlexibleDate("19/06/2026")!.toISOString()).toBe("2026-06-19T00:00:00.000Z");
  });
  it("YYYY-MM-DD", () => {
    expect(parseFlexibleDate("2026-06-19")!.toISOString()).toBe("2026-06-19T00:00:00.000Z");
  });
  it("MM/DD/YYYY khi order=mdy", () => {
    expect(parseFlexibleDate("06/19/2026", "mdy")!.toISOString()).toBe("2026-06-19T00:00:00.000Z");
  });
  it("bỏ phần giờ", () => {
    expect(parseFlexibleDate("19/06/2026 14:30:00")!.toISOString()).toBe("2026-06-19T00:00:00.000Z");
  });
  it("ngày sai -> null", () => {
    expect(parseFlexibleDate("32/13/2026")).toBeNull();
    expect(parseFlexibleDate("xx")).toBeNull();
  });
});

describe("validateBankRows", () => {
  const base: Omit<BankMapping, "amountMode" | "amountCol" | "debitCol" | "creditCol"> = {
    hasHeader: true,
    accountId: "acc1",
    dateCol: 0,
    dateOrder: "dmy",
    noteCol: 3,
  };

  it("chế độ 1 cột có dấu: âm=chi, dương=thu", () => {
    const rows = [
      ["Ngày", "Số tiền", "Số dư", "Nội dung"],
      ["19/06/2026", "-500.000", "9.500.000", "Cà phê"],
      ["20/06/2026", "1.000.000", "10.500.000", "Lương"],
    ];
    const m: BankMapping = { ...base, amountMode: "single", amountCol: 1, debitCol: -1, creditCol: -1 };
    const { valid, errors } = validateBankRows(rows, m);
    expect(errors).toHaveLength(0);
    expect(valid).toHaveLength(2);
    expect(valid[0]).toMatchObject({ type: "EXPENSE", amount: "500000.00", note: "Cà phê", accountId: "acc1", categoryId: null });
    expect(valid[1]).toMatchObject({ type: "INCOME", amount: "1000000.00", note: "Lương" });
  });

  it("chế độ 2 cột Nợ/Có", () => {
    const rows = [
      ["Ngày", "Ghi nợ", "Ghi có", "Mô tả"],
      ["19/06/2026", "500.000", "", "Rút tiền"],
      ["20/06/2026", "", "2.000.000", "Nhận CK"],
    ];
    const m: BankMapping = { ...base, amountMode: "debitCredit", amountCol: -1, debitCol: 1, creditCol: 2 };
    const { valid, errors } = validateBankRows(rows, m);
    expect(errors).toHaveLength(0);
    expect(valid[0]).toMatchObject({ type: "EXPENSE", amount: "500000.00" });
    expect(valid[1]).toMatchObject({ type: "INCOME", amount: "2000000.00" });
  });

  it("báo lỗi dòng sai, giữ dòng đúng", () => {
    const rows = [
      ["Ngày", "Số tiền", "Số dư", "Nội dung"],
      ["xx", "100", "0", "ngày sai"],
      ["19/06/2026", "0", "0", "tiền 0"],
      ["19/06/2026", "100.000", "0", "ok"],
    ];
    const m: BankMapping = { ...base, amountMode: "single", amountCol: 1, debitCol: -1, creditCol: -1 };
    const { valid, errors } = validateBankRows(rows, m);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(2);
  });
});
