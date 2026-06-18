import { prisma } from "./db";
import { applyTransaction } from "./txCore";
import { nextOccurrence } from "./recurring";

const MAX_CATCH_UP = 366; // chặn vòng lặp vô hạn nếu nextRun quá cũ

/**
 * Sinh các giao dịch định kỳ đã tới hạn (nextRun <= now), có "đuổi kịp" nhiều kỳ.
 * Cập nhật nextRun; tự tắt (active=false) khi vượt endDate. Trả số giao dịch đã tạo.
 */
export async function runDueRecurring(now: Date = new Date()): Promise<{ created: number }> {
  const due = await prisma.recurringTransaction.findMany({
    where: { active: true, nextRun: { lte: now } },
  });

  let created = 0;
  for (const r of due) {
    await prisma.$transaction(async (tx) => {
      let cursor = r.nextRun;
      let guard = 0;
      while (cursor <= now && guard < MAX_CATCH_UP) {
        if (r.endDate && cursor > r.endDate) break;
        await applyTransaction(tx, {
          type: r.type,
          amount: r.amount,
          date: cursor,
          note: r.note,
          accountId: r.accountId,
          toAccountId: r.toAccountId,
          categoryId: r.categoryId,
        });
        created++;
        cursor = nextOccurrence(cursor, r.frequency);
        guard++;
      }
      const stillActive = r.endDate ? cursor <= r.endDate : true;
      await tx.recurringTransaction.update({
        where: { id: r.id },
        data: { nextRun: cursor, active: stillActive },
      });
    });
  }
  return { created };
}
