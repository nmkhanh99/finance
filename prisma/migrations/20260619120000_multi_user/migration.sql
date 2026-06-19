-- Multi-user: thêm bảng User và scope dữ liệu cá nhân theo userId.
-- Dữ liệu cũ được gán cho 1 user mặc định (username = 'default') để không mất dữ liệu.

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");

-- Seed: user mặc định nhận toàn bộ dữ liệu cũ
INSERT INTO "User" ("id", "username", "createdAt") VALUES ('usr_default', 'default', CURRENT_TIMESTAMP);

-- AddColumn + backfill + NOT NULL cho từng bảng cá nhân
ALTER TABLE "Account" ADD COLUMN "userId" TEXT;
UPDATE "Account" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "Account" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Category" ADD COLUMN "userId" TEXT;
UPDATE "Category" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Budget" ADD COLUMN "userId" TEXT;
UPDATE "Budget" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "Budget" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Transaction" ADD COLUMN "userId" TEXT;
UPDATE "Transaction" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Holding" ADD COLUMN "userId" TEXT;
UPDATE "Holding" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "Holding" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Debt" ADD COLUMN "userId" TEXT;
UPDATE "Debt" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "Debt" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Goal" ADD COLUMN "userId" TEXT;
UPDATE "Goal" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "Goal" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "RecurringTransaction" ADD COLUMN "userId" TEXT;
UPDATE "RecurringTransaction" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "RecurringTransaction" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "TripGroup" ADD COLUMN "userId" TEXT;
UPDATE "TripGroup" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "TripGroup" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "NetWorthSnapshot" ADD COLUMN "userId" TEXT;
UPDATE "NetWorthSnapshot" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
ALTER TABLE "NetWorthSnapshot" ALTER COLUMN "userId" SET NOT NULL;

-- DropIndex (unique cũ chuyển sang composite theo userId)
DROP INDEX "Holding_symbol_assetType_key";
DROP INDEX "NetWorthSnapshot_date_key";

-- CreateIndex (userId)
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Category_userId_idx" ON "Category"("userId");
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Holding_userId_idx" ON "Holding"("userId");
CREATE INDEX "Debt_userId_idx" ON "Debt"("userId");
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX "RecurringTransaction_userId_idx" ON "RecurringTransaction"("userId");
CREATE INDEX "TripGroup_userId_idx" ON "TripGroup"("userId");

-- CreateIndex (unique composite mới)
CREATE UNIQUE INDEX "Holding_userId_symbol_assetType_key" ON "Holding"("userId", "symbol", "assetType");
CREATE UNIQUE INDEX "NetWorthSnapshot_userId_date_key" ON "NetWorthSnapshot"("userId", "date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripGroup" ADD CONSTRAINT "TripGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NetWorthSnapshot" ADD CONSTRAINT "NetWorthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
