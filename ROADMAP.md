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
- Tài liệu: DEVELOPMENT / USER_GUIDE / CHANGELOG / ROADMAP + rule documentation-maintenance.

## In Progress
- Chưa có (đang chờ chọn task tiếp theo).

## Next
- **Nhắc qua email/push** (hiện chỉ nhắc trong app).
- **Đa tiền tệ** (VND/USD) + tỷ giá.

## Later
- Map cột CSV linh hoạt khi import sao kê ngân hàng (định dạng khác nhau giữa ngân hàng).
- Đa tiền tệ (VND/USD) + tỷ giá.
- Nhắc lịch trả nợ / đáo hạn (push/email).
- Mở rộng danh sách mã crypto hỗ trợ / nhập `priceId` tùy chỉnh.
- Ghi phần chi của "tôi" trong nhóm vào Giao dịch cá nhân (liên kết Trip ↔ tài chính cá nhân).

## Technical Debt
- **Date dùng `timestamp` không-timezone** (lệch +7h) — cân nhắc đổi sang `@db.Date` cho các trường ngày.
- **Auth là 1 mật khẩu single-user** (opt-in) — đủ cho self-host; chưa hỗ trợ nhiều người dùng/đổi mật khẩu trong UI.
- **`minPayment` trong mô phỏng trả nợ** dùng ước tính theo gốc & kỳ hạn gốc (không theo dư nợ thực tế còn lại).
- **Cột giá `Decimal(18,8)`** — đủ cho BTC theo VND hiện tại nhưng cần nới nếu giá/đơn vị vượt ~10 tỷ.
- **Chưa có Docker daemon để verify** image build end-to-end (mới validate cú pháp + build Next).
- **`recharts`** — đã dùng cho biểu đồ dòng tiền (Báo cáo); có thể mở rộng cho Net Worth/giá theo thời gian.
- **Chưa có lint config tùy chỉnh / test cho UI** (chỉ test công thức `lib/`).
