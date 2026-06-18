import ImportForm from "./ImportForm";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Import giao dịch (CSV)</h1>

      <div className="space-y-1 text-sm text-gray-400">
        <p>Định dạng cột (có thể có dòng tiêu đề): <code className="rounded bg-white/10 px-1">date, type, amount, currency, account, to_account, category, note</code></p>
        <ul className="list-inside list-disc text-xs text-gray-500">
          <li><b>date</b>: YYYY-MM-DD · <b>type</b>: Thu/Chi/Chuyển (hoặc INCOME/EXPENSE/TRANSFER)</li>
          <li><b>amount</b>: số nguyên VND (vd 50000) · <b>account</b>/<b>to_account</b>/<b>category</b>: khớp theo tên đã có</li>
          <li>Giao dịch import sẽ <b>cập nhật số dư tài khoản</b> như nhập tay. Dòng lỗi được bỏ qua và liệt kê.</li>
        </ul>
        <p className="text-xs">Mẹo: dùng nút <b>Xuất CSV</b> ở trang Giao dịch để có file mẫu đúng định dạng.</p>
      </div>

      <ImportForm />
    </div>
  );
}
