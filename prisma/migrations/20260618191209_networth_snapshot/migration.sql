-- CreateTable
CREATE TABLE "NetWorthSnapshot" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalCash" DECIMAL(18,2) NOT NULL,
    "totalInvest" DECIMAL(18,2) NOT NULL,
    "totalDebt" DECIMAL(18,2) NOT NULL,
    "netWorth" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetWorthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetWorthSnapshot_date_key" ON "NetWorthSnapshot"("date");
