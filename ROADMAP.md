# ROADMAP

## Done
- Dashboard Net Worth (tiền mặt + đầu tư − nợ).
- Tài khoản (CRUD), Giao dịch (thu/chi/chuyển, tự cập nhật số dư).
- Đầu tư: holdings + P&L; tự cập nhật giá crypto (CoinGecko) & cổ phiếu VN (VNDirect).
- Nợ/Vay: lãi đơn/kép/trả góp đều, lịch trả góp, ghi nhận trả nợ.
- Mục tiêu tiết kiệm (cần X/tháng).
- Báo cáo: dòng tiền, chi theo danh mục, Avalanche vs Snowball.
- Chia tiền nhóm: chia đều/tùy chỉnh, báo cáo, phương án thanh toán tối thiểu.
- Quản lý danh mục (CRUD) trong UI.
- Ngân sách theo tháng + cảnh báo vượt.
- Tìm kiếm & lọc giao dịch (ghi chú / loại / tài khoản / danh mục / tháng).
- Export giao dịch ra CSV (theo bộ lọc).
- Dashboard tổng quan giàu thông tin (dòng tiền tháng, cảnh báo ngân sách, giao dịch gần đây).
- Biểu đồ dòng tiền 6 tháng (Recharts) trên trang Báo cáo.
- Net Worth theo thời gian (snapshot 1/ngày + biểu đồ đường + cron endpoint).
- Giao dịch định kỳ (recurring: ngày/tuần/tháng, đuổi kịp, cron endpoint).
- Import giao dịch từ CSV (validate từng dòng).
- Authentication opt-in (mật khẩu + cookie HMAC + middleware).
- Dockerize (Postgres + app + migrate) qua docker-compose.
- Cron tự động trong Docker (giá / recurring / snapshot Net Worth).
- Biểu đồ lịch sử giá đầu tư (per-holding) từ PriceSnapshot.
- Nhắc khoản nợ / mục tiêu sắp đến hạn trên Dashboard.
- Sửa & tạm dừng/tiếp tục giao dịch định kỳ trong UI.
- Đa tiền tệ (VND base + tỷ giá); Net Worth + dòng tiền + ngân sách quy đổi.
- Tự cập nhật tỷ giá từ API (open.er-api.com) + cron.
- Giao diện Sáng / Tối / Theo hệ thống (ThemeToggle + class `.dark`, chống nhấp nháy, charts theo CSS var).
- Multi-user: đăng nhập bằng username, dữ liệu cách ly theo user (userId mọi bảng cá nhân, chống IDOR); seam `getCurrentUserId()` sẵn cho IdP.
- Đa tiền tệ cho Chia tiền nhóm (TripExpense.currency, báo cáo quy đổi VND).
- Mô phỏng trả nợ chính xác hơn: minPayment = khoản góp cố định theo GỐC & kỳ hạn ban đầu (`toDebtForSim`/`minimumMonthlyPayment`), không hạ thấp theo dư nợ còn lại.
- Liên kết Trip ↔ Giao dịch cá nhân: đánh dấu "Tôi" (`isSelf`); ứng tiền chi phí → giao dịch chi (nhiều nguồn); tổng kết → giao dịch thu/chi + ghi nhận đã thanh toán (`TripSettlement`).
- Nhắc nợ/mục tiêu đến hạn qua **email** (SMTP/nodemailer): `User.email` + trang Cài đặt + cron `/api/reminders/email`.
- Nhắc qua **Web Push** (service worker + VAPID, `web-push`): `PushSubscription` + bật/tắt theo thiết bị + cron `/api/reminders/push`.
- Lint (ESLint flat config `next/core-web-vitals` + TS) chạy sạch; hạ tầng test UI (vitest + jsdom + Testing Library) + test mẫu ThemeToggle.
- Ngày-chỉ chuyển sang `@db.Date` (UTC-midnight): hết lệch +7h. Helper `dateOnly.ts`, mọi chỗ ghi/lọc/nhóm/hiển thị dùng UTC nhất quán.
- Tài liệu: DEVELOPMENT / USER_GUIDE / CHANGELOG / ROADMAP + rule documentation-maintenance.

## In Progress
- Chưa có (đang chờ chọn task tiếp theo).

## Next
- Chưa có (đang chờ chọn task tiếp theo).

## Later
- **Bảo mật đăng nhập thật (Keycloak/OIDC)**: hiện chỉ nhập username không mật khẩu. Cắm IdP qua `User.externalId` (map `sub`) + đổi thân `getCurrentUserId()` trong `src/lib/currentUser.ts` — không phải sửa query. Kèm: trang quản lý user / đổi username, xoá user.
- Map cột CSV linh hoạt khi import sao kê ngân hàng (định dạng khác nhau giữa ngân hàng).
- Mở rộng danh sách mã crypto hỗ trợ / nhập `priceId` tùy chỉnh.

## Technical Debt
- **Đăng nhập chưa có mật khẩu** (chỉ username) — cần cắm Keycloak/OIDC + trang quản lý user (xem Later).
- Docker image **đã build end-to-end pass** (đã thêm `public/.gitkeep`); chưa verify chạy container + kết nối Postgres thực tế.
