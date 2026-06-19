-- Liên kết Trip ↔ Giao dịch (phần B): ghi nhận thanh toán giữa thành viên khi tổng kết.
CREATE TABLE "TripSettlement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripSettlement_groupId_idx" ON "TripSettlement"("groupId");

-- AddForeignKey
ALTER TABLE "TripSettlement" ADD CONSTRAINT "TripSettlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TripGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripSettlement" ADD CONSTRAINT "TripSettlement_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "TripMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripSettlement" ADD CONSTRAINT "TripSettlement_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "TripMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
