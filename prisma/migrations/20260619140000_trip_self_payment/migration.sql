-- Liên kết Trip ↔ Giao dịch (phần A): đánh dấu thành viên "tôi" + link giao dịch ứng tiền.
ALTER TABLE "TripMember" ADD COLUMN "isSelf" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Transaction" ADD COLUMN "tripExpenseId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_tripExpenseId_idx" ON "Transaction"("tripExpenseId");

-- AddForeignKey (xoá khoản chi -> chỉ gỡ link, giữ giao dịch; action sẽ tự dọn trước đó)
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tripExpenseId_fkey" FOREIGN KEY ("tripExpenseId") REFERENCES "TripExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
