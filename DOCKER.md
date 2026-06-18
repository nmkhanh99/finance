# Chạy app bằng Docker

App + Postgres đóng gói sẵn bằng Docker Compose. Không cần cài Node/Postgres trên máy.

## Yêu cầu
- Docker Desktop (hoặc Docker Engine) đang chạy.

## Chạy
```bash
# (tuỳ chọn) tạo file cấu hình DB
cp .env.example .env        # sửa user/pass/cổng nếu muốn

# build + chạy nền
docker compose up -d --build
```
Mở **http://localhost:3000**.

Thứ tự khởi động: `db` (chờ healthy) → `migrate` (chạy `prisma migrate deploy` + seed danh mục, rồi thoát) → `web`.

## Cấu hình (biến môi trường, đặt trong `.env`)
| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `POSTGRES_USER` | `finance` | user Postgres |
| `POSTGRES_PASSWORD` | `finance` | mật khẩu |
| `POSTGRES_DB` | `finance` | tên database |
| `DB_PORT` | `5432` | cổng Postgres mở ra host |
| `WEB_PORT` | `3000` | cổng app mở ra host |

`DATABASE_URL` của app được compose tự dựng: `postgresql://<user>:<pass>@db:5432/<db>?schema=finance`.

## Lệnh hữu ích
```bash
docker compose logs -f web      # xem log app
docker compose ps               # trạng thái
docker compose exec db psql -U finance -d finance   # vào psql
docker compose down             # dừng (giữ dữ liệu)
docker compose down -v          # dừng + XOÁ dữ liệu (volume pgdata)
```

## Cập nhật sau khi sửa code / schema
```bash
docker compose up -d --build    # build lại; migrate tự chạy migration mới
```

## Tự động hoá (cron)
Service `cron` (Alpine + busybox crond) tự gọi định kỳ các endpoint của `web`:
- **Cập nhật giá** (crypto + CK VN): mỗi 15 phút → `/api/prices/refresh`
- **Sinh giao dịch định kỳ**: 00:05 hằng ngày → `/api/recurring/run`
- **Snapshot Net Worth**: 23:30 hằng ngày → `/api/networth/snapshot`

Lịch trong `docker/cron.sh` (giờ UTC). Khi **bật auth** (`AUTH_PASSWORD`), nhớ đặt `CRON_SECRET` trong `.env` để cron vượt qua middleware (gọi kèm `?key=...`). Xem log: `docker compose logs -f cron`.

## Ghi chú
- Dữ liệu Postgres lưu ở volume `pgdata` (không mất khi `down`, chỉ mất khi `down -v`).
- Khi đổi schema Prisma: tạo migration lúc dev local (`npm run db:migrate`), commit thư mục `prisma/migrations`, rồi `up --build` — service `migrate` sẽ apply.
- Chạy local không Docker: bỏ comment `DATABASE_URL` trong `.env` rồi `npm run dev`.
