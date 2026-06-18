# Kế hoạch xây dựng Web Quản lý Tài chính Cá nhân

> Soạn ngày 2026-06-19. Bản kế hoạch local — dùng để triển khai hoặc làm input cho `/ultraplan`.

---

## 1. Bối cảnh & Mục tiêu

Bạn có tình hình tài chính nhiều mảnh, nằm rải rác:
- **Tài sản:** tiền mặt, **nhiều** tài khoản ngân hàng, đầu tư chứng khoán, **tiền ảo (giá biến động)**.
- **Nợ:** nhiều khoản vay với **lãi suất khác nhau**.
- **Dòng tiền:** thu nhập + chi tiêu.

App cần trả lời được 5 câu hỏi cốt lõi:
1. **Tôi đang có bao nhiêu tiền?** → Tổng tài sản ròng (Net Worth = Tài sản − Nợ).
2. **Từng khoản đầu tư lãi/lỗ bao nhiêu?** → P&L theo thời gian thực (chứng khoán, crypto).
3. **Tôi đang nợ bao nhiêu, lãi phải trả bao nhiêu?** → Dư nợ + lãi dồn, lịch trả.
4. **Tiền của tôi đi đâu?** → Theo dõi & phân loại chi tiêu.
5. **Bao lâu nữa tôi đạt mục tiêu X tiền?** → Lập kế hoạch & dự phóng.

> **Lưu ý về thư mục `tai-lieu/`:** 8 PDF trong đó là tài liệu bài giảng *"Quản trị đổi mới trong kinh doanh"* — KHÔNG liên quan đến app tài chính. Đã loại khỏi phạm vi.

---

## 2. Phạm vi tính năng (theo độ ưu tiên)

### MVP (làm trước — đủ để tự dùng hằng ngày)
| Nhóm | Tính năng |
|------|-----------|
| **Tài khoản & số dư** | CRUD ví/tài khoản (tiền mặt, từng ngân hàng); cập nhật số dư thủ công |
| **Giao dịch** | Ghi thu/chi; phân loại (category); chuyển tiền giữa tài khoản; ghi chú |
| **Đầu tư** | Sổ holdings: mã + số lượng + giá vốn; tính giá thị trường → P&L (lãi/lỗ) |
| **Nợ/Vay** | Khoản vay: gốc, lãi suất, kỳ hạn; tính lãi dồn & dư nợ hiện tại |
| **Dashboard** | Net Worth tổng; biểu đồ phân bổ tài sản; thu/chi tháng; tổng dư nợ |

### Phase 2 (tự động hoá & sâu hơn)
- **Tự cập nhật giá:** crypto (CoinGecko) + chứng khoán VN (vnstock/TCBS) qua cron.
- **Kế hoạch mục tiêu:** "cần Y tiền trong Z tháng" → tính số tiền/tháng cần tiết kiệm, dự phóng theo lãi kép.
- **Chiến lược trả nợ:** so sánh **Avalanche** (ưu tiên lãi cao) vs **Snowball** (ưu tiên dư nợ nhỏ).
- **Ngân sách (budget)** theo category + cảnh báo vượt.
- **Báo cáo:** dòng tiền theo tháng/năm, xu hướng net worth, lịch sử P&L.

### Phase 3 (nâng cao — tùy nhu cầu)
- Đa tiền tệ (VND/USD), tỷ giá.
- Nhập sao kê CSV; (rủi ro cao) tích hợp Open Banking.
- Nhắc lịch trả nợ / đáo hạn (push/email).
- Đa người dùng / chia sẻ.

---

## 3. Mô hình dữ liệu (entities chính)

```
User (1) ─┬─< Account        # tiền mặt, ngân hàng — type, balance, currency
          ├─< Transaction    # income/expense/transfer — amount, date, categoryId, accountId
          ├─< Category       # ăn uống, lương, ... (income|expense)
          ├─< Holding        # đầu tư — symbol, assetType(stock|crypto), quantity, avgCost
          │      └─< PriceSnapshot   # giá theo thời gian (cache từ API)
          ├─< Debt           # vay — principal, interestRate, type(simple|compound), termMonths, startDate
          │      └─< DebtPayment      # mỗi lần trả gốc/lãi
          └─< Goal           # mục tiêu — name, targetAmount, targetDate, currentSaved, linkedAccounts
```

**Quy ước quan trọng:**
- Lưu tiền dạng **số nguyên (đơn vị nhỏ nhất, vd cent/đồng)** hoặc `Decimal` — **tuyệt đối không dùng `float`** cho tiền (sai số làm tròn).
- Mọi giao dịch có `date` + `createdAt` riêng (ngày phát sinh ≠ ngày nhập).
- `Holding.avgCost` cập nhật theo bình quân gia quyền khi mua thêm.

---

## 4. Logic tài chính cốt lõi (công thức)

**Net Worth**
```
NetWorth = Σ(số dư tài khoản) + Σ(holding.qty × giá thị trường) − Σ(dư nợ còn lại)
```

**P&L đầu tư**
```
Lãi/lỗ chưa thực hiện = qty × (giá hiện tại − giá vốn TB)
% = (giá hiện tại − giá vốn) / giá vốn × 100
```

**Lãi vay**
```
Lãi đơn:  Lãi = Gốc × lãi suất × thời gian
Lãi kép:  Số dư = Gốc × (1 + r)^n
Trả góp đều (annuity):  PMT = P × r(1+r)^n / ((1+r)^n − 1)
```

**Kế hoạch mục tiêu** ("cần Y trong Z tháng", lãi suất tiết kiệm r/tháng)
```
Không lãi:  tiền/tháng = (Y − đã có) / Z
Có lãi kép (FV annuity):  PMT = (FV − PV(1+r)^Z) × r / ((1+r)^Z − 1)
```

**Trả nợ — so sánh chiến lược** (nguồn: Wells Fargo, Fidelity)
- **Avalanche:** trả khoản **lãi suất cao nhất** trước → tiết kiệm tổng lãi nhiều nhất (tối ưu toán học).
- **Snowball:** trả khoản **dư nợ nhỏ nhất** trước → tạo động lực tâm lý (nghiên cứu HBR: tỷ lệ trả hết nợ cao hơn).
- App cho nhập số tiền trả thêm/tháng → mô phỏng số tháng & tổng lãi của cả 2 cách.

---

## 5. Tech Stack đề xuất

**Khuyến nghị: Next.js full-stack** (1 codebase, web-first, dễ deploy, dễ mở rộng API).

| Lớp | Lựa chọn | Lý do |
|-----|----------|-------|
| Framework | **Next.js 15 (App Router) + TypeScript** | Full-stack 1 repo, server actions, SEO không cần |
| UI | **Tailwind CSS + shadcn/ui** | Component đẹp sẵn, nhanh |
| Biểu đồ | **Recharts** (hoặc Tremor) | Dashboard tài chính chuẩn |
| DB | **PostgreSQL** (Neon/Supabase free tier) | Quan hệ rõ, hỗ trợ `Decimal` |
| ORM | **Prisma** | Type-safe, migration dễ |
| Auth | **Auth.js (NextAuth)** hoặc Supabase Auth | Đăng nhập 1 user/nhiều user |
| Tiền tệ | **dinero.js** hoặc `Decimal` của Prisma | Tránh lỗi float |
| Cron giá | Vercel Cron / API route theo lịch | Cập nhật giá định kỳ |
| Deploy | **Vercel** (app) + **Neon** (DB) | Free tier đủ dùng cá nhân |

> Nếu muốn **chạy local/offline hoàn toàn**, đổi DB sang **SQLite** (Prisma vẫn dùng được) — đơn giản hơn cho 1 người dùng.

---

## 6. Nguồn dữ liệu giá (tích hợp ngoài)

**Tiền ảo — [CoinGecko API](https://www.coingecko.com/en/api):**
- Free tier: ~10.000 credits/tháng, 100 calls/phút, lịch sử 1 năm → quá đủ cho cá nhân.
- Endpoint `simple/price` để lấy giá hiện tại theo coin id + VND/USD.
- **Cache giá** vào `PriceSnapshot`, cập nhật mỗi 5–15 phút bằng cron (đừng gọi mỗi lần load trang).

**Chứng khoán Việt Nam:**
- **[vnstock](https://vnstocks.com/docs/vnstock)** (Python, free) — phổ biến nhất; hoặc public API của **TCBS** (JSON, không cần đăng ký).
- **SSI FastConnect Data** (free nhưng phải ra quầy đăng ký bằng CCCD).
- Vì stack là JS, 2 hướng: (a) gọi thẳng public API TCBS từ Node; (b) viết 1 microservice Python nhỏ dùng vnstock rồi expose REST.

**Ngân hàng:** Việt Nam **chưa có Open Banking phổ cập** → **MVP nhập số dư thủ công** hoặc **import CSV sao kê**. Tránh phụ thuộc tích hợp ngân hàng ở giai đoạn đầu.

---

## 7. Màn hình chính (UI)

1. **Dashboard** — Net Worth lớn + delta tháng; donut phân bổ tài sản; thu/chi tháng; tổng nợ + lãi sắp tới.
2. **Accounts** — danh sách ví/ngân hàng + số dư; nút cập nhật nhanh.
3. **Transactions** — bảng lọc theo tháng/category/account; thêm nhanh.
4. **Investments** — bảng holdings: mã, số lượng, giá vốn, giá hiện tại, P&L, %; tổng portfolio.
5. **Debts** — danh sách khoản vay: dư nợ, lãi suất, lãi dồn, lịch trả; trang mô phỏng Avalanche/Snowball.
6. **Goals** — tạo mục tiêu (số tiền + deadline) → thanh tiến độ + "cần tiết kiệm X/tháng".
7. **Reports** — biểu đồ net worth theo thời gian, dòng tiền, lịch sử P&L.

---

## 8. Lộ trình triển khai

| Bước | Nội dung | Verify |
|------|----------|--------|
| 0 | `git init` + scaffold Next.js + Tailwind + Prisma | App chạy `localhost:3000` |
| 1 | Schema Prisma + migrate (Account/Transaction/Category) | Tạo/sửa/xoá tài khoản & giao dịch |
| 2 | Dashboard Net Worth (chỉ tiền mặt + ngân hàng) | Số tổng khớp tay tính |
| 3 | Holdings + nhập giá tay → P&L | Lãi/lỗ tính đúng theo công thức §4 |
| 4 | Debts + tính lãi & lịch trả | Đối chiếu công thức annuity |
| 5 | Tích hợp giá crypto (CoinGecko) + cron cache | Giá tự cập nhật, có fallback khi API lỗi |
| 6 | Giá chứng khoán VN (TCBS/vnstock) | Mã VN cập nhật được |
| 7 | Goals + dự phóng tiết kiệm | "X/tháng" khớp công thức FV |
| 8 | Budget + báo cáo + Avalanche/Snowball | So sánh 2 chiến lược ra số tháng/tổng lãi |

Mỗi bước: viết vài test cho công thức tài chính (§4) trước khi làm UI — đây là phần dễ sai nhất.

---

## 9. Rủi ro & Lưu ý

- 🔐 **Bảo mật:** đây là dữ liệu tài chính nhạy cảm. Bắt buộc auth; cân nhắc mã hoá at-rest; **không** commit `.env`/API key. Nếu chỉ tự dùng → có thể chạy local/self-host.
- 💵 **Float tiền:** dùng `Decimal`/integer, không `float`.
- 🌐 **Rate limit API:** luôn cache giá, có fallback khi API down; đừng để dashboard chết vì API.
- 📉 **Crypto biến động:** lưu lịch sử snapshot để vẽ chart & tính P&L theo thời điểm, không chỉ giá realtime.
- 🏦 **Không over-engineer Open Banking** ở MVP — VN chưa sẵn, tốn công vô ích.
- ⚠️ **Disclaimer:** app hỗ trợ theo dõi, không phải tư vấn đầu tư.

---

## 10. Tham khảo

**App mẫu để học UX/tính năng:**
- [Ghostfolio](https://www.ghostfol.io/en) — open-source, tracking net worth + cổ phiếu/crypto (tham khảo code & data model rất tốt).
- [Kubera](https://www.kubera.com/) — bảng cân đối nhiều loại tài sản.
- Monarch Money / Empower / Quicken Simplifi — dashboard tổng hợp, TWR/IRR.

**Nguồn tham khảo (web research 2026):**
- Crypto API: [CoinGecko API](https://www.coingecko.com/en/api) · [Best free crypto APIs](https://www.coingecko.com/learn/best-free-crypto-api)
- CK Việt Nam: [vnstock docs](https://vnstocks.com/docs/vnstock) · [SSI FastConnect](https://guide.ssi.com.vn/ssi-products/tieng-viet/fastconnect-data/danh-sach-cac-api) · [API thị trường VN](https://hub.algotrade.vn/knowledge-hub/api-tren-thi-truong-chung-khoan-viet-nam/)
- Trả nợ: [Wells Fargo snowball vs avalanche](https://www.wellsfargo.com/goals-credit/smarter-credit/manage-your-debt/snowball-vs-avalanche-paydown/) · [Fidelity](https://www.fidelity.com/learning-center/personal-finance/avalanche-snowball-debt)

---

## 11. Ghi chú: git chưa khởi tạo

`git init` đã thử nhưng **chưa thành công** (commit báo `not a git repository`). Để dùng `/ultraplan` (cloud) hoặc bắt đầu code, chạy lại trong terminal:

```bash
cd /Users/khanhnm/Desktop/finance
git init
git add -A
git commit -m "init: finance app planning"
```

Sau đó có thể `/ultraplan` để lập kế hoạch chi tiết hơn trên cloud, hoặc bắt đầu Bước 0 ở §8.
