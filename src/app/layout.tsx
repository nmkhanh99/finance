import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { authEnabled } from "@/lib/auth";
import { logout } from "./login/actions";
import ThemeToggle from "./ThemeToggle";

// Đặt class .dark trước khi paint để tránh nhấp nháy (theo lựa chọn đã lưu / hệ thống).
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Quản lý Tài chính Cá nhân",
  description: "Theo dõi tài sản, đầu tư, nợ và mục tiêu tài chính",
};

const NAV = [
  { href: "/", label: "Tổng quan" },
  { href: "/accounts", label: "Tài khoản" },
  { href: "/transactions", label: "Giao dịch" },
  { href: "/import", label: "Import" },
  { href: "/categories", label: "Danh mục" },
  { href: "/recurring", label: "Định kỳ" },
  { href: "/investments", label: "Đầu tư" },
  { href: "/debts", label: "Nợ / Vay" },
  { href: "/goals", label: "Mục tiêu" },
  { href: "/budgets", label: "Ngân sách" },
  { href: "/rates", label: "Tỷ giá" },
  { href: "/reports", label: "Báo cáo" },
  { href: "/trips", label: "Chia tiền nhóm" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <div className="min-h-screen">
          <header className="border-b border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-black/20">
            <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-3">
              <span className="mr-4 font-semibold text-emerald-600 dark:text-emerald-400">💰 Finance</span>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-black/5 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <div className="ml-auto flex items-center gap-1">
                <ThemeToggle />
                {authEnabled() && (
                  <form action={logout}>
                    <button className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white">
                      Đăng xuất
                    </button>
                  </form>
                )}
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
