/** Tạo CSV an toàn (escape dấu phẩy, nháy kép, xuống dòng). Dùng CRLF theo chuẩn RFC 4180. */

export function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
