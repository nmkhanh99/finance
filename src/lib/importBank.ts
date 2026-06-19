import type { TransactionType } from "@prisma/client";
import type { ParsedImportRow } from "./importTx";

/** Cấu hình map cột khi import sao kê ngân hàng (mỗi bank một định dạng). */
export interface BankMapping {
  hasHeader: boolean;
  accountId: string;
  dateCol: number;
  dateOrder: "dmy" | "mdy" | "ymd";
  amountMode: "single" | "debitCredit";
  amountCol: number; // single: 1 cột có dấu (âm = chi, dương = thu)
  debitCol: number; // debitCredit: cột Nợ -> chi
  creditCol: number; // debitCredit: cột Có -> thu
  noteCol: number; // -1 nếu không map
}

/**
 * Parse số tiền linh hoạt từ sao kê: bỏ ký hiệu tiền tệ/khoảng trắng, xử lý phân tách
 * nghìn/thập phân (cả "1,000,000.5" lẫn "1.000.000,5"), ngoặc đơn = âm. null nếu không đọc được.
 */
export function parseAmount(raw: string): number | null {
  let s = (raw ?? "").trim();
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) {
    neg = true;
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("-")) {
    neg = true;
    s = s.slice(1);
  }
  s = s.replace(/[^0-9.,]/g, ""); // bỏ tiền tệ, khoảng trắng, dấu trừ còn sót
  if (!s) return null;

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot && hasComma) {
    // dấu xuất hiện sau cùng là thập phân, dấu kia là phân tách nghìn
    const decIsDot = s.lastIndexOf(".") > s.lastIndexOf(",");
    s = decIsDot ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    const p = s.split(",");
    s = p.length === 2 && p[1].length <= 2 ? p.join(".") : p.join(""); // ",xx" thập phân, còn lại nghìn
  } else if (hasDot) {
    const p = s.split(".");
    if (!(p.length === 2 && p[1].length <= 2)) s = p.join(""); // ".xxx" là nghìn -> bỏ
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

/** Parse ngày linh hoạt: "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY" (bỏ phần giờ). UTC-midnight. */
export function parseFlexibleDate(raw: string, order: "dmy" | "mdy" | "ymd" = "dmy"): Date | null {
  const s = (raw ?? "").trim().split(/[ T]/)[0];
  if (!s) return null;
  const ymd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  const other = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  let y: number, mo: number, d: number;
  if (ymd) {
    y = +ymd[1];
    mo = +ymd[2];
    d = +ymd[3];
  } else if (other) {
    if (order === "mdy") {
      mo = +other[1];
      d = +other[2];
    } else {
      d = +other[1];
      mo = +other[2];
    }
    y = +other[3];
  } else {
    const t = new Date(s);
    if (Number.isNaN(t.getTime())) return null;
    return new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()));
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(Date.UTC(y, mo - 1, d));
}

/** Validate & map các dòng sao kê thành giao dịch (thu/chi cho 1 tài khoản). Thuần (không DB). */
export function validateBankRows(rows: string[][], m: BankMapping): { valid: ParsedImportRow[]; errors: string[] } {
  if (rows.length === 0) return { valid: [], errors: ["CSV rỗng."] };
  const dataRows = m.hasHeader ? rows.slice(1) : rows;
  const valid: ParsedImportRow[] = [];
  const errors: string[] = [];
  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");

  dataRows.forEach((r, n) => {
    const line = n + 1 + (m.hasHeader ? 1 : 0);

    const date = parseFlexibleDate(cell(r, m.dateCol), m.dateOrder);
    if (!date) return void errors.push(`Dòng ${line}: ngày "${cell(r, m.dateCol)}" không đọc được.`);

    let type: TransactionType;
    let amount: number;
    if (m.amountMode === "debitCredit") {
      const deb = Math.abs(parseAmount(cell(r, m.debitCol)) ?? 0);
      const cre = Math.abs(parseAmount(cell(r, m.creditCol)) ?? 0);
      if (deb > 0 && cre > 0) return void errors.push(`Dòng ${line}: cả Nợ và Có đều có giá trị.`);
      if (deb > 0) {
        type = "EXPENSE";
        amount = deb;
      } else if (cre > 0) {
        type = "INCOME";
        amount = cre;
      } else {
        return void errors.push(`Dòng ${line}: không có số tiền Nợ/Có.`);
      }
    } else {
      const a = parseAmount(cell(r, m.amountCol));
      if (a === null || a === 0) return void errors.push(`Dòng ${line}: số tiền "${cell(r, m.amountCol)}" không hợp lệ.`);
      type = a < 0 ? "EXPENSE" : "INCOME";
      amount = Math.abs(a);
    }

    valid.push({
      type,
      amount: amount.toFixed(2),
      date,
      note: cell(r, m.noteCol) || null,
      accountId: m.accountId,
      toAccountId: null,
      categoryId: null,
    });
  });

  return { valid, errors };
}
