import type { TransactionType } from "@prisma/client";

export interface NamedRef {
  id: string;
  name: string;
}

export interface ParsedImportRow {
  type: TransactionType;
  amount: string; // chuỗi số (caller chuyển sang Decimal — không qua float)
  date: Date;
  note: string | null;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
}

const HEADER_TOKENS = ["date", "type", "amount", "account"];
const DEFAULT_COLS = ["date", "type", "amount", "currency", "account", "to_account", "category", "note"];
const TYPE_MAP: Record<string, TransactionType> = {
  income: "INCOME",
  thu: "INCOME",
  expense: "EXPENSE",
  chi: "EXPENSE",
  transfer: "TRANSFER",
  chuyen: "TRANSFER",
  "chuyển": "TRANSFER",
};

/** Validate & map các dòng CSV thành giao dịch. Thuần (không DB) để unit-test. */
export function validateImportRows(
  rows: string[][],
  accounts: NamedRef[],
  categories: NamedRef[],
): { valid: ParsedImportRow[]; errors: string[] } {
  if (rows.length === 0) return { valid: [], errors: ["CSV rỗng."] };

  const first = rows[0].map((c) => c.trim().toLowerCase());
  const hasHeader = HEADER_TOKENS.some((t) => first.includes(t));
  const cols = hasHeader ? first : DEFAULT_COLS;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const accByName = new Map(accounts.map((a) => [a.name.trim().toLowerCase(), a.id]));
  const catByName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id]));

  const valid: ParsedImportRow[] = [];
  const errors: string[] = [];

  dataRows.forEach((r, n) => {
    const line = n + 1 + (hasHeader ? 1 : 0);
    const get = (name: string) => {
      const i = cols.indexOf(name);
      return i >= 0 ? (r[i] ?? "").trim() : "";
    };

    const type = TYPE_MAP[get("type").toLowerCase()];
    if (!type) return void errors.push(`Dòng ${line}: loại "${get("type")}" không hợp lệ.`);

    const rawAmount = get("amount").replace(/\s/g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(rawAmount) || Number(rawAmount) <= 0) {
      return void errors.push(`Dòng ${line}: số tiền "${get("amount")}" không hợp lệ.`);
    }

    const date = new Date(get("date"));
    if (isNaN(date.getTime())) return void errors.push(`Dòng ${line}: ngày "${get("date")}" không hợp lệ.`);

    const accountId = accByName.get(get("account").toLowerCase());
    if (!accountId) return void errors.push(`Dòng ${line}: tài khoản "${get("account")}" không tồn tại.`);

    let toAccountId: string | null = null;
    if (type === "TRANSFER") {
      toAccountId = accByName.get(get("to_account").toLowerCase()) ?? null;
      if (!toAccountId || toAccountId === accountId) {
        return void errors.push(`Dòng ${line}: tài khoản nhận không hợp lệ cho giao dịch chuyển.`);
      }
    }

    valid.push({
      type,
      amount: rawAmount,
      date,
      note: get("note") || null,
      accountId,
      toAccountId,
      categoryId: catByName.get(get("category").toLowerCase()) ?? null,
    });
  });

  return { valid, errors };
}
