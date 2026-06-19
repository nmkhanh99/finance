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
    auth.ts             # ký/verify cookie phiên HMAC (Web Crypto), mang userId
    currentUser.ts      # getCurrentUserId/requireUserId — SEAM resolve user (đổi 1 chỗ khi cắm IdP)
    userSetup.ts        # seedDefaultCategories — seed danh mục cho user mới
    dateOnly.ts         # ngày-chỉ UTC-midnight (parseDateInput/monthStartUTC) — khớp @db.Date
    reminders.ts        # buildReminders + tiện ích ngày (Dashboard & email dùng chung)
    email.ts            # gửi email SMTP (nodemailer) + HTML nhắc nhở
    push.ts             # Web Push (web-push + VAPID) + payload nhắc nhở
    networth.ts         # computeNetWorth(userId) + recordNetWorthSnapshot(userId)
    txCore.ts           # applyTransaction — tạo giao dịch + cập nhật số dư (dùng chung)
    recurring.ts        # nextOccurrence (tần suất, pure)
    recurringRun.ts     # runDueRecurring — sinh giao dịch định kỳ tới hạn
    reminders.ts        # addMonths/daysBetween/dueStatus — nhắc đến hạn
    currency.ts         # convertToBase — quy đổi đa tiền tệ về VND
    rates.ts            # loadRates — nạp bảng tỷ giá (server)
    fxRates.ts          # refreshFxRates — lấy tỷ giá live (open.er-api.com)
    txFilter.ts         # buildTransactionWhere — lọc giao dịch dùng chung
    csv.ts              # xuất CSV an toàn (escape RFC 4180)
    csvParse.ts         # parse CSV (RFC 4180) cho import
    importTx.ts         # validateImportRows — validate dòng CSV -> giao dịch (pure)
    format.ts           # format tiền/ngày (vi-VN)
    *.test.ts           # unit test (vitest)
Dockerfile, docker-compose.yml, .dockerignore, .env.example, DOCKER.md
```

## 3. Công nghệ đang dùng
- **Next.js 15.5.19** (App Router) + **React 19** + **TypeScript 5**.
- **Tailwind CSS v4** (`@tailwindcss/postcss`).
- **Prisma 6** + **PostgreSQL**.
- **Vitest 4** (test công thức `lib/` ở node + test UI qua jsdom/Testing Library) + **ESLint 9** (flat config).
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
npm run test        # vitest: .test.ts (node, công thức lib/) + .test.tsx (jsdom, UI)
npm run build       # next build (kèm typecheck toàn bộ)
npm run lint        # eslint . (flat config next/core-web-vitals + typescript)
npm run db:studio   # Prisma Studio xem dữ liệu
```
Quy ước: **viết test cho công thức tài chính trước khi làm UI**. Test UI dùng Testing Library — file `*.test.tsx` cần dòng `// @vitest-environment jsdom` ở đầu (xem `ThemeToggle.test.tsx`); setup chung ở `src/test/setup.ts`. Mỗi tính năng verify end-to-end (chèn dữ liệu → so số hiển thị với tính tay).

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

**Người dùng:**
- `User` (username unique, email? — nhận nhắc email, externalId? — để map IdP/Keycloak sau) → `PushSubscription` (endpoint unique, p256dh, auth) cho Web Push. Mọi bảng cá nhân bên dưới có `userId` (FK, onDelete Cascade); dữ liệu cách ly theo user. `ExchangeRate` là GLOBAL (không có userId).

**Tài chính cá nhân (đều có `userId`):**
- `Account` (CASH|BANK, balance, currency)
- `Category` (INCOME|EXPENSE)
- `Transaction` (INCOME|EXPENSE|TRANSFER, amount, date, accountId, toAccountId?, categoryId?)
- `Holding` (symbol, STOCK|CRYPTO, quantity, avgCost) → `PriceSnapshot` (price, at)
- `Debt` (principal, interestRate, SIMPLE|COMPOUND|AMORTIZING, termMonths, startDate) → `DebtPayment` (amount, principal, interest, date)
- `Goal` (targetAmount, currentSaved, targetDate)
- `Budget` (categoryId unique, limitAmount) — hạn mức chi/tháng theo danh mục
- `NetWorthSnapshot` (unique [userId,date], totalCash/Invest/Debt, netWorth) — lịch sử Net Worth (1/ngày/user)
- `RecurringTransaction` (type, amount, frequency, startDate, nextRun, endDate, active) — mẫu giao dịch định kỳ
- `ExchangeRate` (code, rate) — tỷ giá quy đổi về VND (base); VND=1

**Chia tiền nhóm (độc lập):**
- `TripGroup` → `TripMember`, `TripExpense`
- `TripExpense` (description, amount, currency, date, EQUAL|CUSTOM, payerId) → `TripExpenseShare` (memberId, amount). amount & shares theo `currency` của khoản; báo cáo quy đổi VND.
- `TripMember.isSelf` đánh dấu thành viên là chủ tài khoản (bạn). `Transaction.tripExpenseId` link giao dịch sinh ra khi bạn ứng tiền. `TripSettlement` (from/toMember, amount VND, `transactionId?`) ghi nhận thanh toán khi tổng kết.

## 9. Luồng xử lý chính
- **Net Worth** = Σ số dư tài khoản + Σ(qty × giá thị trường) − Σ dư nợ. Giá thị trường = `PriceSnapshot` mới nhất, fallback `avgCost`.
- **Giao dịch**: tạo/xoá trong `$transaction` → cập nhật số dư `Account` (income +, expense −, transfer chuyển giữa 2 account).
- **Cập nhật giá**: `lib/prices.ts` → crypto qua CoinGecko (VND), cổ phiếu VN qua VNDirect dchart (×1000). Ghi `PriceSnapshot`. Gọi qua nút trên trang Đầu tư hoặc `GET /api/prices/refresh` (cron).
- **Trả nợ ghi nhận**: tự tách lãi (dư nợ × lãi tháng) và gốc.
- **Chia tiền nhóm**: mỗi `TripExpense` lưu share từng người (theo `currency` của khoản) → quy đổi VND (`convertToBase`/`loadRates`) → tính paid/owed/net mỗi người, **trừ các `TripSettlement` đã ghi** → `settle()` cho phương án chuyển tối thiểu. Chia đều dùng `equalSplit` (VND số nguyên; tiền tệ khác scale ×100 cho 2 số lẻ).
- **Liên kết Trip ↔ giao dịch cá nhân**: khi người trả là `isSelf`, ứng tiền qua nhiều tài khoản → `applyTransaction` (EXPENSE) gắn `tripExpenseId`. Khi tổng kết, `recordSettlement` tạo `TripSettlement` + (nếu liên quan self & chọn tài khoản) giao dịch thu/chi (quy đổi VND→tiền tệ tài khoản) lưu `transactionId`. Xoá khoản chi/hoàn tác thanh toán đều hoàn lại số dư.

## 10. Quyết định kỹ thuật quan trọng
- **Server Actions thay vì REST**: đơn giản, 1 codebase, ít boilerplate.
- **Lưu share chi phí tường minh** (không tính lại lúc đọc): đảm bảo bảo toàn tổng tiền dù chia đều hay tùy chỉnh.
- **Ngày-chỉ = UTC-midnight + `@db.Date`**: tránh lệch múi giờ. Quy ước: ghi qua `parseDateInput`, lọc/nhóm tháng qua `monthStartUTC` + `getUTC*`, hiển thị qua `formatDate` (timeZone UTC). KHÔNG dùng `new Date(y,m,d)` (local) cho mốc lọc. `createdAt/updatedAt` và `RecurringTransaction.nextRun` vẫn là timestamp.
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
- **Authentication (multi-user, BẮT BUỘC)**: đăng nhập bằng username (chưa có mật khẩu). Cookie phiên `fin_session` ký HMAC-SHA256 (Web Crypto, `src/lib/auth.ts`) mang `userId`, httpOnly, 7 ngày; `src/middleware.ts` chặn mọi route trừ `/login` (yêu cầu phiên hợp lệ). `AUTH_SECRET` ký cookie (nên đặt khi deploy); `CRON_SECRET` cho cron gọi `/api/*` qua `?key=`.
- **Cách ly dữ liệu (IDOR)**: mọi query qua `requireUserId()` (`src/lib/currentUser.ts`) + filter `userId`; update/delete dùng `*Many` theo `{id,userId}` hoặc guard sở hữu; model con (PriceSnapshot/DebtPayment/Trip*) verify qua cha. **Mở rộng tính năng mới phải giữ pattern này.**
- **Cắm bảo mật thật sau (Keycloak/OIDC)**: chỉ đổi thân `getCurrentUserId()` + map `User.externalId`; query không phải sửa. **Đặt mật khẩu/IdP trước khi deploy public.**
- Không ghi dữ liệu tài chính thật, token, mật khẩu vào tài liệu/commit.
- Khi deploy: cân nhắc mã hoá at-rest, dùng mật khẩu DB mạnh (mặc định Docker `finance/finance` chỉ cho local).
- Disclaimer: app hỗ trợ theo dõi, không phải tư vấn đầu tư.

## 13. Scripts & lệnh
`dev`, `build`, `start`, `lint`, `test`, `test:watch`, `db:migrate`, `db:generate`, `db:studio`, `db:seed`. Docker: `docker compose up -d --build`.

## 14. Biến môi trường & cron
- `DATABASE_URL` — kết nối Postgres (bắt buộc).
- `AUTH_SECRET` — ký cookie phiên (bỏ trống = secret mặc định không an toàn, chỉ cho local). `CRON_SECRET` — cho cron gọi `/api/*` qua `?key=`. (Đăng nhập bằng username, không còn `AUTH_PASSWORD`.)
- `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` — bật & cấu hình gửi email nhắc nhở (nodemailer). Mỗi user đặt `email` ở trang Cài đặt; cron `/api/reminders/email` (07:00) gửi cho mọi user có email. Bỏ trống = tắt email.
- `VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT` — bật Web Push (`npx web-push generate-vapid-keys`). Cần HTTPS/localhost; mỗi thiết bị tự đăng ký ở Cài đặt (service worker `public/sw.js`); cron `/api/reminders/push` (07:05). Middleware cho `/sw.js` truy cập công khai.
- **Cron tự động (Docker):** service `cron` chạy `docker/cron.sh` (busybox crond) gọi `/api/prices/refresh` (15 phút), `/api/recurring/run`, `/api/networth/snapshot`, `/api/rates/refresh`, `/api/reminders/email` & `/api/reminders/push` (hằng ngày). Chạy thủ công ngoài Docker: đặt crontab gọi `curl` tới các endpoint đó (xem comment trong mỗi route).
