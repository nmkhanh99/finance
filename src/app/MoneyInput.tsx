"use client";

import { useState } from "react";

/** Hiển thị số nguyên với dấu tách nghìn kiểu VN (12196 -> "12.196"). */
function fmt(digits: string): string {
  return digits ? Number(digits).toLocaleString("vi-VN") : "";
}
/** Chỉ giữ chữ số, bỏ số 0 thừa ở đầu. */
function toDigits(s: string): string {
  return s.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

/**
 * Ô nhập tiền (VND nguyên): hiện dạng có tách nghìn cho dễ đọc, nhưng gửi **số thô**
 * qua input ẩn (name) để server đọc đúng. Nhập được mọi giá trị (không bị step chặn).
 */
export default function MoneyInput({
  name,
  defaultValue,
  required,
  placeholder,
  className,
}: {
  name: string;
  defaultValue?: number | string | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const seed = defaultValue == null || defaultValue === "" ? "" : String(Math.round(Number(defaultValue)));
  const [digits, setDigits] = useState(seed);
  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        value={fmt(digits)}
        onChange={(e) => setDigits(toDigits(e.target.value))}
        required={required}
        placeholder={placeholder}
        className={className}
      />
      <input type="hidden" name={name} value={digits} />
    </>
  );
}
