import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/currentUser";
import ImportTabs from "./ImportTabs";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const userId = await requireUserId();
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Import giao dịch (CSV)</h1>

      <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
        <p><b>Sao kê ngân hàng</b>: tải file CSV của bất kỳ ngân hàng nào → chọn tài khoản đích và <b>tự map cột</b> (Ngày, Số tiền hoặc Nợ/Có, Nội dung). Tự nhận số kiểu <code className="rounded bg-black/5 dark:bg-white/10 px-1">1.000.000</code>/<code className="rounded bg-black/5 dark:bg-white/10 px-1">1,000,000</code> và ngày DD/MM/YYYY.</p>
        <p><b>Định dạng app</b>: file đúng cột <code className="rounded bg-black/5 dark:bg-white/10 px-1">date, type, amount, currency, account, to_account, category, note</code> (dùng nút <b>Xuất CSV</b> ở trang Giao dịch để có mẫu).</p>
        <p className="text-xs text-gray-600 dark:text-gray-500">Giao dịch import <b>cập nhật số dư tài khoản</b>. Dòng lỗi được bỏ qua &amp; liệt kê.</p>
      </div>

      <ImportTabs accounts={accounts} />
    </div>
  );
}
