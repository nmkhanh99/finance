-- CreateTable
CREATE TABLE "ExchangeRate" (
    "code" TEXT NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("code")
);
