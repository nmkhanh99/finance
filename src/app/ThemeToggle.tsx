"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Áp class .dark lên <html> theo lựa chọn. */
function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

const NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const META: Record<Theme, { icon: string; label: string }> = {
  light: { icon: "☀️", label: "Sáng" },
  dark: { icon: "🌙", label: "Tối" },
  system: { icon: "🖥️", label: "Hệ thống" },
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // Đồng bộ state với lựa chọn đã lưu (script chống nhấp nháy đã set class trước đó).
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setTheme(saved);
  }, []);

  // Khi ở chế độ "system", đổi theo hệ điều hành.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function cycle() {
    const next = NEXT[theme];
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  const m = META[theme];
  return (
    <button
      onClick={cycle}
      title={`Giao diện: ${m.label} (bấm để đổi)`}
      aria-label={`Giao diện: ${m.label}`}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
    >
      <span aria-hidden>{m.icon}</span>
      <span className="hidden sm:inline">{m.label}</span>
    </button>
  );
}
