# CHANGELOG

Mọi thay đổi đáng chú ý của dự án. Format: `## YYYY-MM-DD` với Added / Changed / Fixed / Technical.

## 2026-06-19

### Added
- **Authentication (opt-in)**: đăng nhập 1 mật khẩu qua `AUTH_PASSWORD`, cookie phiên ký HMAC (Web Crypto, không thêm dependency), middleware chặn route, nút Đăng xuất, cron bypass `?key=CRON_SECRET`.
- **Import giao dịch từ CSV** (trang Import): tải file hoặc dán CSV; validate từng dòng, báo lỗi cụ thể, cập nhật số dư; parser CSV chuẩn RFC 4180.
- **Giao dịch định kỳ** (trang Định kỳ): mẫu thu/chi/chuyển theo tần suất ngày/tuần/tháng; nút "Chạy ngay" + cron `/api/recurring/run` tự sinh giao dịch (đuổi kịp nhiều kỳ, tự dừng khi hết hạn).
- **Net Worth theo thời gian**: nút "Ghi lại Net Worth hôm nay" (snapshot 1/ngày) + biểu đồ đường (Recharts) + endpoint cron `/api/networth/snapshot`.
- **Biểu đồ dòng tiền 6 tháng** (Recharts) trên trang Báo cáo: cột Thu/Chi theo tháng, tooltip VND.
- **Xuất giao dịch ra CSV** (`/api/transactions/export`): theo bộ lọc hiện tại, có BOM UTF-8, số tiền dạng số thô.
- **Tìm kiếm & lọc giao dịch**: lọc theo ghi chú / loại / tài khoản / danh mục / tháng; hiển thị số giao dịch khớp + tổng tiền.
- **Ngân sách theo tháng** (trang Ngân sách): đặt hạn mức/tháng cho danh mục Chi; thanh tiến độ đã-chi/hạn-mức (xanh/vàng/đỏ); **cảnh báo vượt ngân sách** + đếm số danh mục vượt.
- **Quản lý danh mục** (trang Danh mục): thêm / sửa tên / xoá danh mục Thu-Chi; hiển thị số giao dịch mỗi danh mục; xoá an toàn (gỡ nhãn khỏi giao dịch, không mất giao dịch).
- Dashboard **Tổng quan**: tài sản ròng (Net Worth) + phân bổ Tiền mặt / Đầu tư / Dư nợ.
- **Tài khoản**: CRUD ví tiền mặt / ngân hàng, cập nhật số dư.
- **Giao dịch**: thu / chi / chuyển khoản, tự cập nhật số dư tài khoản; danh mục seed sẵn.
- **Đầu tư**: quản lý holdings (gộp & tính giá vốn TB), P&L theo giá thị trường; tự cập nhật giá tiền ảo (CoinGecko) và cổ phiếu VN (VNDirect); nút "Cập nhật giá" + endpoint `/api/prices/refresh` cho cron.
- **Nợ/Vay**: khoản vay (lãi đơn/kép/trả góp đều), dư nợ, lịch trả góp, ghi nhận trả nợ (tự tách gốc/lãi).
- **Mục tiêu**: theo dõi mục tiêu tiết kiệm, gợi ý "cần tiết kiệm X/tháng".
- **Báo cáo**: dòng tiền tháng, chi theo danh mục, so sánh chiến lược trả nợ Avalanche vs Snowball.
- **Chia tiền nhóm** (Splitwise-style): nhóm + thành viên, chi phí (chia đều / tùy chỉnh, chọn người tham gia), báo cáo phân tích, phương án thanh toán tối thiểu.
- Tài liệu dự án: `DEVELOPMENT.md`, `USER_GUIDE.md`, `CHANGELOG.md`, `ROADMAP.md`.

### Changed
- **Dashboard Tổng quan** bổ sung: dòng tiền tháng (thu/chi/còn lại), cảnh báo vượt ngân sách, 5 giao dịch gần đây.
- Nút cập nhật giá đổi từ "Cập nhật giá crypto" → "Cập nhật giá" (gộp crypto + chứng khoán VN).

### Fixed
- Tính số tháng còn lại của Mục tiêu sai (1 năm thành 13 tháng) do timestamp không-timezone lệch +7h → chuyển sang tính theo lịch (year/month).
- VNDirect trả HTTP 406 với Node fetch → thêm header `User-Agent` kiểu trình duyệt.

### Technical
- **Tự động hoá cron trong Docker**: service `cron` (Alpine + busybox crond) gọi định kỳ `/api/prices/refresh` (15 phút), `/api/recurring/run` & `/api/networth/snapshot` (hằng ngày); truyền `CRON_SECRET` để qua auth. Web service nhận thêm env `AUTH_PASSWORD/AUTH_SECRET/CRON_SECRET`.
- Khởi tạo Next.js 15 + TypeScript + Tailwind v4 + Prisma 6 + PostgreSQL + Vitest.
- Migration `init`: Account, Category, Transaction, Holding, PriceSnapshot, Debt, DebtPayment, Goal.
- Migration `trip_split`: TripGroup, TripMember, TripExpense, TripExpenseShare.
- Migration `budget`: model `Budget` (hạn mức/tháng theo danh mục); `src/lib/budget.ts` + 4 unit test.
- Migration `networth_snapshot`: model `NetWorthSnapshot`; `src/lib/networth.ts` (`computeNetWorth`/`recordNetWorthSnapshot`) — tách logic Net Worth, Dashboard tái dùng (bỏ trùng lặp).
- Migration `recurring`: model `RecurringTransaction` + enum `RecurrenceFrequency`; `src/lib/recurring.ts` (`nextOccurrence` +4 test), `src/lib/txCore.ts` (`applyTransaction` dùng chung), `src/lib/recurringRun.ts`; refactor `createTransaction` dùng `applyTransaction`. Tổng 37 test pass.
- `src/lib/csv.ts` (+6 test) và `src/lib/txFilter.ts` (tách `buildTransactionWhere` dùng chung trang Giao dịch + export).
- `src/lib/csvParse.ts` (+6 test) và `src/lib/importTx.ts` (`validateImportRows`, +5 test) cho import; dùng `applyTransaction` để ghi.
- `src/lib/auth.ts` (+8 test) + `src/middleware.ts` cho authentication (Web Crypto HMAC). Tổng 56 test pass.
- `src/lib/finance.ts` + 17 unit test; `src/lib/split.ts` + 6 unit test (tổng 48 test pass).
- Tiền lưu bằng `Decimal` (không dùng float).
- Dockerize: `Dockerfile` (multi-stage, Next standalone), `docker-compose.yml` (Postgres + migrate + web), `.dockerignore`, `.env.example`, `DOCKER.md`.
- Thêm rule `documentation-maintenance` (bắt buộc duy trì tài liệu trước khi commit).
