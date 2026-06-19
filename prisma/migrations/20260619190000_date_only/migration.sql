-- Chuyển các trường ngày-chỉ sang DATE (UTC) để tránh lệch múi giờ.
-- Dữ liệu cũ ghi bằng new Date("YYYY-MM-DD") = UTC-midnight nên cast ::date không lệch.
ALTER TABLE "Transaction" ALTER COLUMN "date" SET DATA TYPE DATE USING "date"::date;
ALTER TABLE "Debt" ALTER COLUMN "startDate" SET DATA TYPE DATE USING "startDate"::date;
ALTER TABLE "DebtPayment" ALTER COLUMN "date" SET DATA TYPE DATE USING "date"::date;
ALTER TABLE "Goal" ALTER COLUMN "targetDate" SET DATA TYPE DATE USING "targetDate"::date;
ALTER TABLE "TripExpense" ALTER COLUMN "date" SET DATA TYPE DATE USING "date"::date;
ALTER TABLE "TripSettlement" ALTER COLUMN "date" SET DATA TYPE DATE USING "date"::date;
ALTER TABLE "RecurringTransaction" ALTER COLUMN "startDate" SET DATA TYPE DATE USING "startDate"::date;
ALTER TABLE "RecurringTransaction" ALTER COLUMN "endDate" SET DATA TYPE DATE USING "endDate"::date;
