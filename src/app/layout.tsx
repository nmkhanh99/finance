import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
  { href: "/reports", label: "Báo cáo" },
  { href: "/trips", label: "Chia tiền nhóm" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-white/10 bg-black/20">
            <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
              <span className="mr-4 font-semibold text-emerald-400">💰 Finance</span>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
