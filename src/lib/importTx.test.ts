import { describe, it, expect } from "vitest";
import { validateImportRows } from "./importTx";

const accounts = [
  { id: "a1", name: "Vietcombank" },
  { id: "a2", name: "Tiền mặt" },
];
const categories = [{ id: "c1", name: "Ăn uống" }];

describe("validateImportRows", () => {
  it("dòng hợp lệ (có header, type tiếng Việt)", () => {
    const rows = [
      ["date", "type", "amount", "currency", "account", "to_account", "category", "note"],
      ["2026-06-19", "Chi", "50000", "VND", "Vietcombank", "", "Ăn uống", "cafe"],
    ];
    const { valid, errors } = validateImportRows(rows, accounts, categories);
    expect(errors).toEqual([]);
    expect(valid).toHaveLength(1);
    expect(valid[0]).toMatchObject({
      type: "EXPENSE",
      amount: "50000",
      accountId: "a1",
      categoryId: "c1",
      toAccountId: null,
    });
  });

  it("chuyển khoản hợp lệ", () => {
    const rows = [
      ["date", "type", "amount", "currency", "account", "to_account", "category", "note"],
      ["2026-06-19", "Chuyển", "100000", "VND", "Vietcombank", "Tiền mặt", "", ""],
    ];
    const { valid, errors } = validateImportRows(rows, accounts, categories);
    expect(errors).toEqual([]);
    expect(valid[0]).toMatchObject({ type: "TRANSFER", accountId: "a1", toAccountId: "a2" });
  });

  it("bắt lỗi: tài khoản không tồn tại, tiền/loại sai", () => {
    const rows = [
      ["date", "type", "amount", "account"],
      ["2026-06-19", "Chi", "50000", "KhôngCó"],
      ["2026-06-19", "Lung tung", "50000", "Tiền mặt"],
      ["2026-06-19", "Chi", "-5", "Tiền mặt"],
    ];
    const { valid, errors } = validateImportRows(rows, accounts, categories);
    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(3);
  });

  it("category không khớp -> null (không lỗi)", () => {
    const rows = [
      ["date", "type", "amount", "account", "category"],
      ["2026-06-19", "Chi", "50000", "Tiền mặt", "KhôngCó"],
    ];
    const { valid, errors } = validateImportRows(rows, accounts, categories);
    expect(errors).toEqual([]);
    expect(valid[0].categoryId).toBeNull();
  });

  it("không header -> dùng thứ tự cột mặc định", () => {
    const rows = [["2026-06-19", "Chi", "50000", "VND", "Tiền mặt", "", "", "ghi chú"]];
    const { valid } = validateImportRows(rows, accounts, categories);
    expect(valid[0]).toMatchObject({ type: "EXPENSE", amount: "50000", accountId: "a2" });
  });
});
