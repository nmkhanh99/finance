# CHANGELOG

Mọi thay đổi đáng chú ý của dự án. Format: `## YYYY-MM-DD` với Added / Changed / Fixed / Technical.

## 2026-06-19

### Added
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
- Nút cập nhật giá đổi từ "Cập nhật giá crypto" → "Cập nhật giá" (gộp crypto + chứng khoán VN).

### Fixed
- Tính số tháng còn lại của Mục tiêu sai (1 năm thành 13 tháng) do timestamp không-timezone lệch +7h → chuyển sang tính theo lịch (year/month).
- VNDirect trả HTTP 406 với Node fetch → thêm header `User-Agent` kiểu trình duyệt.

### Technical
- Khởi tạo Next.js 15 + TypeScript + Tailwind v4 + Prisma 6 + PostgreSQL + Vitest.
- Migration `init`: Account, Category, Transaction, Holding, PriceSnapshot, Debt, DebtPayment, Goal.
- Migration `trip_split`: TripGroup, TripMember, TripExpense, TripExpenseShare.
- `src/lib/finance.ts` + 17 unit test; `src/lib/split.ts` + 6 unit test (tổng 23 test pass).
- Tiền lưu bằng `Decimal` (không dùng float).
- Dockerize: `Dockerfile` (multi-stage, Next standalone), `docker-compose.yml` (Postgres + migrate + web), `.dockerignore`, `.env.example`, `DOCKER.md`.
- Thêm rule `documentation-maintenance` (bắt buộc duy trì tài liệu trước khi commit).
