# DEVELOPMENT.md — Tài liệu phát triển

App quản lý tài chính cá nhân + chia tiền nhóm. Tài liệu này đủ để clone repo và tiếp tục phát triển.

## 1. Tổng quan kiến trúc
- **Full-stack 1 codebase** bằng Next.js App Router (server components + Server Actions). Không có REST API riêng cho CRUD — mọi thao tác ghi đi qua **Server Actions** (`actions.ts` mỗi route). Chỉ có 1 API route HTTP: `/api/prices/refresh` (cho cron cập nhật giá).
- **Render**: tất cả trang đặt `export const dynamic = "force-dynamic"` → luôn đọc dữ liệu mới từ DB, không cache.
- **DB truy cập trực tiếp** qua Prisma Client (singleton) trong server components/actions.
- **State management**: gần như không có client state. Chỉ 1 client component duy nhất: `src/app/trips/[id]/ExpenseForm.tsx` (chọn người chia / chế độ chia).
- **Logic tài chính tách riêng** thành hàm thuần trong `src/lib/` để unit-test (vitest).

## 2. Cấu trúc thư mục
```
prisma/
  schema.prisma         # toàn bộ data model
  migrations/           # migration đã commit (init, trip_split)
  seed.ts               # seed danh mục mặc định (idempotent)
src/
  app/
    layout.tsx          # shell + nav
    page.tsx            # Dashboard (Net Worth)
    accounts/           # tài khoản (page.tsx + actions.ts)
    transactions/       # giao dịch thu/chi/chuyển
    investments/        # đầu tư + P&L + nút cập nhật giá
    debts/              # nợ/vay + lịch trả góp
    goals/              # mục tiêu tiết kiệm
    reports/            # báo cáo dòng tiền + Avalanche/Snowball
    trips/              # chia tiền nhóm (list + [id] + ExpenseForm.tsx)
    api/prices/refresh/ # route cron cập nhật giá
  lib/
    db.ts               # Prisma Client singleton
    finance.ts          # công thức tài chính (Net Worth, P&L, lãi, FV, payoff)
    split.ts            # chia tiền nhóm + phương án thanh toán
    budget.ts           # đánh giá ngân sách (spent vs limit)
    networth.ts         # computeNetWorth + recordNetWorthSnapshot (Dashboard tái dùng)
    txCore.ts           # applyTransaction — tạo giao dịch + cập nhật số dư (dùng chung)
    recurring.ts        # nextOccurrence (tần suất, pure)
    recurringRun.ts     # runDueRecurring — sinh giao dịch định kỳ tới hạn
    txFilter.ts         # buildTransactionWhere — lọc giao dịch dùng chung
    csv.ts              # xuất CSV an toàn (escape RFC 4180)
    format.ts           # format tiền/ngày (vi-VN)
    *.test.ts           # unit test (vitest)
Dockerfile, docker-compose.yml, .dockerignore, .env.example, DOCKER.md
```

## 3. Công nghệ đang dùng
- **Next.js 15.5.19** (App Router) + **React 19** + **TypeScript 5**.
- **Tailwind CSS v4** (`@tailwindcss/postcss`).
- **Prisma 6** + **PostgreSQL**.
- **Vitest 2** (test công thức).
- **Docker / Docker Compose** (xem `DOCKER.md`).

## 4. Chạy app local (không Docker)
Yêu cầu: Node 22+, PostgreSQL đang chạy.
```bash
npm install
# .env: DATABASE_URL="postgresql://<user>@localhost:5432/postgres?schema=finance"
npm run db:migrate      # apply migrations
npm run db:seed         # seed danh mục
npm run dev             # http://localhost:3000
```
Chạy bằng Docker: xem `DOCKER.md` (`docker compose up -d --build`).

## 5. Test / lint / build
```bash
npm run test        # vitest (công thức finance.ts + split.ts)
npm run build       # next build (kèm typecheck toàn bộ)
npm run lint        # next lint
npm run db:studio   # Prisma Studio xem dữ liệu
```
Quy ước: **viết test cho công thức tài chính trước khi làm UI**. Mỗi tính năng verify end-to-end (chèn dữ liệu → so số hiển thị với tính tay).

## 6. Quy ước code
- Tiền **luôn lưu bằng `Decimal`** (Prisma `@db.Decimal`), **không dùng `float`**. Khi tính trong `lib/` thì `Number()` hóa rồi làm tròn về đồng (`round2` / `Math.round`).
- Lãi suất lưu dạng thập phân theo năm (0.12 = 12%/năm).
- Hàm logic thuần đặt ở `src/lib/`, có test.
- Component server mặc định; chỉ dùng `"use client"` khi cần tương tác.
- Đặt tên route theo tính năng; mỗi route có `page.tsx` + `actions.ts` (nếu có ghi dữ liệu).

## 7. Quy ước Git commit
- Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`...
- Làm trên feature branch, merge fast-forward vào `main`, xoá branch tạm.
- Commit kèm cả code **và tài liệu** (theo rule `documentation-maintenance`).
- Footer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## 8. Database schema / data model
PostgreSQL, schema `finance`. Các model (xem `prisma/schema.prisma`):

**Tài chính cá nhân:**
- `Account` (CASH|BANK, balance, currency)
- `Category` (INCOME|EXPENSE)
- `Transaction` (INCOME|EXPENSE|TRANSFER, amount, date, accountId, toAccountId?, categoryId?)
- `Holding` (symbol, STOCK|CRYPTO, quantity, avgCost) → `PriceSnapshot` (price, at)
- `Debt` (principal, interestRate, SIMPLE|COMPOUND|AMORTIZING, termMonths, startDate) → `DebtPayment` (amount, principal, interest, date)
- `Goal` (targetAmount, currentSaved, targetDate)
- `Budget` (categoryId unique, limitAmount) — hạn mức chi/tháng theo danh mục
- `NetWorthSnapshot` (date unique, totalCash/Invest/Debt, netWorth) — lịch sử Net Worth (1/ngày)
- `RecurringTransaction` (type, amount, frequency, startDate, nextRun, endDate, active) — mẫu giao dịch định kỳ

**Chia tiền nhóm (độc lập):**
- `TripGroup` → `TripMember`, `TripExpense`
- `TripExpense` (description, amount, date, EQUAL|CUSTOM, payerId) → `TripExpenseShare` (memberId, amount)

## 9. Luồng xử lý chính
- **Net Worth** = Σ số dư tài khoản + Σ(qty × giá thị trường) − Σ dư nợ. Giá thị trường = `PriceSnapshot` mới nhất, fallback `avgCost`.
- **Giao dịch**: tạo/xoá trong `$transaction` → cập nhật số dư `Account` (income +, expense −, transfer chuyển giữa 2 account).
- **Cập nhật giá**: `lib/prices.ts` → crypto qua CoinGecko (VND), cổ phiếu VN qua VNDirect dchart (×1000). Ghi `PriceSnapshot`. Gọi qua nút trên trang Đầu tư hoặc `GET /api/prices/refresh` (cron).
- **Trả nợ ghi nhận**: tự tách lãi (dư nợ × lãi tháng) và gốc.
- **Chia tiền nhóm**: mỗi `TripExpense` lưu share từng người → tính paid/owed/net mỗi người → `settle()` cho phương án chuyển tối thiểu.

## 10. Quyết định kỹ thuật quan trọng
- **Server Actions thay vì REST**: đơn giản, 1 codebase, ít boilerplate.
- **Lưu share chi phí tường minh** (không tính lại lúc đọc): đảm bảo bảo toàn tổng tiền dù chia đều hay tùy chỉnh.
- **Giá cache vào `PriceSnapshot`** thay vì gọi API mỗi lần render (tránh rate limit, có lịch sử giá).
- **Dùng VNDirect thay TCBS**: endpoint public TCBS đã đổi/đóng (404). VNDirect cần header `User-Agent` kiểu trình duyệt (nếu thiếu → 406).
- **Schema Postgres riêng `finance`**: tách khỏi `public`.
- **Tháng còn lại của Goal tính theo lịch** (year/month), không theo `ngày/30.44` — tránh lệch do timestamp không-timezone (+7h) làm tròn sai.

## 11. Dependency chính & lý do
| Dependency | Lý do |
|---|---|
| next, react | Framework full-stack |
| @prisma/client, prisma | ORM type-safe + migration |
| tailwindcss, @tailwindcss/postcss | Styling |
| vitest | Test công thức tài chính |
| decimal.js | Hỗ trợ Decimal (Prisma re-export `Prisma.Decimal`) |
| recharts | Vẽ biểu đồ (hiện: dòng tiền 6 tháng ở trang Báo cáo, client component) |
| tsx | Chạy `prisma/seed.ts` |

## 12. Ghi chú bảo mật (dữ liệu tài chính cá nhân — nhạy cảm)
- **`.env` đã `.gitignore`** — không commit `DATABASE_URL`/secret.
- **Chưa có authentication** — app hiện chạy single-user local/self-host. **Bắt buộc thêm auth trước khi deploy public.**
- Không ghi dữ liệu tài chính thật, token, mật khẩu vào tài liệu/commit.
- Khi deploy: cân nhắc mã hoá at-rest, dùng mật khẩu DB mạnh (mặc định Docker `finance/finance` chỉ cho local).
- Disclaimer: app hỗ trợ theo dõi, không phải tư vấn đầu tư.

## 13. Scripts & lệnh
`dev`, `build`, `start`, `lint`, `test`, `test:watch`, `db:migrate`, `db:generate`, `db:studio`, `db:seed`. Docker: `docker compose up -d --build`.
