-- Nới cột giá/giá vốn từ Decimal(18,8) -> (24,8) để chịu được giá/đơn vị > ~10 tỷ VND.
ALTER TABLE "Holding" ALTER COLUMN "avgCost" SET DATA TYPE DECIMAL(24,8);
ALTER TABLE "PriceSnapshot" ALTER COLUMN "price" SET DATA TYPE DECIMAL(24,8);
