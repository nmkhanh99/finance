-- CoinGecko coin id tùy chỉnh cho holding (ưu tiên hơn map theo symbol).
ALTER TABLE "Holding" ADD COLUMN "priceId" TEXT;
