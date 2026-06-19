-- Đa tiền tệ cho chia tiền nhóm: mỗi TripExpense có currency riêng (mặc định VND).
-- Hàng cũ tự nhận 'VND' qua DEFAULT.
ALTER TABLE "TripExpense" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'VND';
