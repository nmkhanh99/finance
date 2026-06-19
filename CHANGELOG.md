# CHANGELOG

Mọi thay đổi đáng chú ý của dự án. Format: `## YYYY-MM-DD` với Added / Changed / Fixed / Technical.

## 2026-06-19

### Added
- **Nhắc nhở qua Web Push**: thông báo đẩy trên trình duyệt (kể cả khi không mở app) cho khoản nợ/mục tiêu đến hạn. Bật riêng từng thiết bị ở trang **Cài đặt** (đăng ký qua service worker `public/sw.js` + VAPID), nút "Gửi thử". Cron `/api/reminders/push` (07:05) gửi cho mọi user có đăng ký, tự dọn subscription hết hạn. Qua `web-push` + khoá VAPID (`npx web-push generate-vapid-keys`). Model `PushSubscription`; `src/lib/push.ts`; middleware cho phép `/sw.js` công khai.
- **Nhắc nhở qua email**: gửi email tóm tắt khoản nợ/mục tiêu sắp đến hạn (≤30 ngày hoặc quá hạn). Trang **Cài đặt** (⚙) để đặt email nhận + nút "Gửi thử ngay"; cron `/api/reminders/email` gửi 07:00 hằng ngày cho mọi user có email. Qua SMTP (nodemailer) cấu hình bằng env `SMTP_*` (vd Gmail App Password). Tách `buildReminders` dùng chung Dashboard & email (+3 test). `User.email`; `src/lib/email.ts`.
- **Liên kết Trip ↔ Giao dịch (phần A — ứng tiền)**: đánh dấu 1 thành viên là "Tôi" (cờ `isSelf`); khi bạn là người trả 1 khoản chi, có thể trừ thẳng vào **một hoặc nhiều** tài khoản cá nhân (mỗi nguồn 1 dòng) → sinh giao dịch chi liên kết, ghi **toàn bộ** số đã ứng (tùy chọn — để trống thì không tạo). Xoá khoản chi sẽ hoàn lại số dư & gỡ giao dịch. `TripMember.isSelf`, `Transaction.tripExpenseId` (migration `trip_self_payment`).
- **Liên kết Trip ↔ Giao dịch (phần B — tổng kết)**: ở "Phương án thanh toán", mỗi khoản có nút **Ghi nhận** để đánh dấu đã thanh toán (cập nhật cân bằng). Nếu khoản liên quan tới bạn: chọn tài khoản → tạo giao dịch **thu** (bạn nhận) / **chi** (bạn trả), quy đổi VND→tiền tệ tài khoản, link vào bản ghi. Có danh sách "Đã ghi nhận thanh toán" + Hoàn tác (gỡ giao dịch & hoàn số dư). Model `TripSettlement` (migration `trip_settlement`).
- **Đa tiền tệ cho Chia tiền nhóm**: mỗi khoản chi nhóm có tiền tệ riêng (ô "Tiền tệ" khi thêm chi phí, mặc định VND). Danh sách hiện số gốc + "≈ VND"; báo cáo cân bằng & phương án thanh toán quy đổi mọi khoản về VND theo tỷ giá (`convertToBase`/`loadRates`). Chia đều cho phép 2 số lẻ với tiền tệ ≠ VND. Thêm cột `TripExpense.currency` (migration `trip_currency`, hàng cũ → VND).
- **Multi-user (đăng nhập bằng username)**: mỗi người dùng có dữ liệu riêng (tài khoản, giao dịch, đầu tư, nợ, mục tiêu, ngân sách, định kỳ, nhóm chia tiền). Màn đăng nhập nhập username — chưa có sẽ tự tạo (kèm seed danh mục mặc định), chưa cần mật khẩu. Thanh nav hiện `@username` + Đăng xuất. Dữ liệu cũ được gán user `default` (đăng nhập `default` để xem). Thiết kế sẵn `User.externalId` + lớp `getCurrentUserId()` để cắm Keycloak/OIDC sau mà không phải sửa query.
- **Giao diện Sáng / Tối / Theo hệ thống**: nút ☀️/🌙/🖥️ trên thanh nav (cycle), lưu lựa chọn vào `localStorage`; mặc định theo hệ điều hành và tự đổi khi đổi chế độ hệ thống. Dark bật bằng class `.dark` trên `<html>` (Tailwind `@custom-variant dark`), script inline chống nhấp nháy khi tải. `src/app/ThemeToggle.tsx`; biến màu light/dark + token chart trong `globals.css`; charts đọc màu qua CSS var. Toàn bộ 21 file UI chuyển class dark-only → cặp light + `dark:`.
- **Tự cập nhật tỷ giá từ API** (open.er-api.com): nút trên trang Tỷ giá + endpoint cron `/api/rates/refresh`; `src/lib/fxRates.ts`.
- **Đa tiền tệ**: model `ExchangeRate` + trang **Tỷ giá** (base VND); chọn tiền tệ khi tạo Tài khoản/Đầu tư; Net Worth & tổng tài khoản/đầu tư quy đổi về VND. `src/lib/currency.ts` (`convertToBase`, +3 test).
- **Nhắc nhở đến hạn** trên Dashboard: khoản nợ còn dư sắp đáo hạn (startDate+kỳ hạn) và mục tiêu chưa đạt sắp đến hạn — trong 30 ngày (vàng) hoặc quá hạn (đỏ); `src/lib/reminders.ts` +3 test.
- **Biểu đồ lịch sử giá đầu tư** (trang Đầu tư): chọn mã → đường giá theo thời gian từ `PriceSnapshot` (Recharts).
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
- **Dòng tiền (Báo cáo + Dashboard) & Ngân sách** giờ quy đổi mỗi giao dịch về VND theo tiền tệ tài khoản (trước đây cộng thô). Thêm `src/lib/rates.ts` (`loadRates`).
- **Giao dịch định kỳ** thêm Tạm dừng/Tiếp tục (active) và Sửa (số tiền, tần suất, ngày kỳ tới, ngày kết thúc, ghi chú).
- **Dashboard Tổng quan** bổ sung: dòng tiền tháng (thu/chi/còn lại), cảnh báo vượt ngân sách, 5 giao dịch gần đây.
- Nút cập nhật giá đổi từ "Cập nhật giá crypto" → "Cập nhật giá" (gộp crypto + chứng khoán VN).

### Fixed
- **Mô phỏng trả nợ (Avalanche/Snowball) sai khoản tối thiểu**: minPayment trước tính theo *dư nợ còn lại* nên thấp hơn nghĩa vụ thực → overstate số tháng & tổng lãi. Nay tính theo **gốc & kỳ hạn ban đầu** (khoản góp cố định) qua `toDebtForSim`/`minimumMonthlyPayment` trong `src/lib/finance.ts` (+4 test). Trang Báo cáo dùng helper này.
- Docker build fail ở bước `COPY /app/public` (`"/app/public": not found`) do project chưa có thư mục `public/` → thêm `public/.gitkeep`. Build end-to-end pass.
- Tính số tháng còn lại của Mục tiêu sai (1 năm thành 13 tháng) do timestamp không-timezone lệch +7h → chuyển sang tính theo lịch (year/month).
- VNDirect trả HTTP 406 với Node fetch → thêm header `User-Agent` kiểu trình duyệt.

### Technical
- **Nới cột giá `Decimal(18,8)` → `(24,8)`** (`Holding.avgCost`, `PriceSnapshot.price`): chịu được giá/đơn vị > ~10 tỷ VND (migration `widen_price_decimal`, widening an toàn không mất dữ liệu).
- **Multi-user data model**: thêm model `User`; cột `userId` + FK (onDelete Cascade) cho 10 bảng cá nhân; unique chuyển per-user (`Holding[userId,symbol,assetType]`, `NetWorthSnapshot[userId,date]`). Migration `multi_user` viết tay (tạo user `default` + backfill dữ liệu cũ, không mất dữ liệu). `ExchangeRate` giữ global. Session cookie HMAC nay mang `userId` (`createUserSession`/`readUserSession`); seam `src/lib/currentUser.ts` (`getCurrentUserId`/`requireUserId`) — chỗ duy nhất phải đổi khi cắm IdP. Mọi query scope theo `userId`, kiểm sở hữu chống IDOR (update/delete dùng `*Many` theo `{id,userId}` hoặc guard); cron (`/api/*`) chạy đa user, nút "Cập nhật giá"/"Chạy ngay" chỉ tác động user hiện tại. Build + 65 test pass; smoke test runtime (redirect/401 khi chưa login, 200 + dữ liệu đúng khi có phiên).
- **Nâng cấp & vá bảo mật dependency**: `recharts` 2.15 → 3.8 (hết deprecated; 3 chart dùng API cơ bản nên không đổi code), `vitest` 2.1 → 4.1. Lỗ hổng `npm audit` 7 → 2 (dọn sạch critical + high + 3 moderate của toolchain vitest/vite/esbuild). 2 moderate còn lại là `postcss` transitive trong Next — không fix được an toàn (npm muốn hạ Next 15→9), chờ Next ra bản vá. Build + 65 test pass. Thêm retry mạng cho `npm ci` trong `Dockerfile` (chống `ECONNRESET`).
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
