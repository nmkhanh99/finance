import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { requiredMonthlySaving } from "@/lib/finance";
import { createGoal, updateSaved, deleteGoal } from "./actions";

export const dynamic = "force-dynamic";

/** Số tháng còn lại đến hạn, tính theo lịch (đúng 1 năm = 12 tháng). 0 nếu đã đến/quá hạn. */
function monthsUntil(target: Date): number {
  const now = new Date();
  if (target <= now) return 0;
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(months, 1); // còn trong tháng này -> tính 1 kỳ
}

export default async function GoalsPage() {
  const goals = await prisma.goal.findMany({ orderBy: { targetDate: "asc" } });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Mục tiêu tài chính</h1>

      {/* Form thêm mục tiêu */}
      <form
        action={createGoal}
        className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-4"
      >
        <label className="col-span-2 flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Tên mục tiêu</span>
          <input name="name" required placeholder="VD: Mua nhà" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Số tiền cần (VND)</span>
          <input name="targetAmount" type="number" step="1000" min="0" required className="rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Đã có (VND)</span>
          <input name="currentSaved" type="number" step="1000" min="0" defaultValue={0} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Hạn đạt được</span>
          <input name="targetDate" type="date" required className="rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
        </label>
        <button className="self-end rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">+ Thêm</button>
      </form>

      {/* Danh sách mục tiêu */}
      <div className="space-y-4">
        {goals.length === 0 && <p className="text-gray-400">Chưa có mục tiêu nào.</p>}
        {goals.map((g) => {
          const target = Number(g.targetAmount);
          const saved = Number(g.currentSaved);
          const months = monthsUntil(g.targetDate);
          const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
          const perMonth = requiredMonthlySaving(target, saved, months, 0);
          const done = saved >= target;

          return (
            <div key={g.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-medium">{g.name}</div>
                  <div className="text-xs text-gray-400">
                    {formatMoney(saved)} / {formatMoney(target)} · hạn {formatDate(g.targetDate)}
                    {months > 0 ? ` · còn ${months} tháng` : " · đã đến/quá hạn"}
                  </div>
                </div>
                <form action={deleteGoal}>
                  <input type="hidden" name="id" value={g.id} />
                  <button className="rounded-lg border border-red-500/30 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10">Xoá</button>
                </form>
              </div>

              {/* Thanh tiến độ */}
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full ${done ? "bg-emerald-400" : "bg-sky-400"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-400">{progress.toFixed(1)}%</div>

              {/* Gợi ý tiết kiệm */}
              <div className="mt-4 border-t border-white/10 pt-3 text-sm">
                {done ? (
                  <span className="font-medium text-emerald-400">🎉 Đã đạt mục tiêu!</span>
                ) : months === 0 ? (
                  <span className="text-amber-400">
                    Còn thiếu <span className="font-semibold">{formatMoney(target - saved)}</span> và đã đến hạn.
                  </span>
                ) : (
                  <span className="text-gray-300">
                    Cần tiết kiệm{" "}
                    <span className="font-semibold text-emerald-400">{formatMoney(perMonth)}/tháng</span>{" "}
                    trong {months} tháng để đạt mục tiêu.
                  </span>
                )}
              </div>

              {/* Cập nhật đã tiết kiệm */}
              <form action={updateSaved} className="mt-3 flex items-end gap-2">
                <input type="hidden" name="id" value={g.id} />
                <label className="flex flex-col text-xs">
                  <span className="mb-1 text-gray-400">Cập nhật số đã có</span>
                  <input name="currentSaved" type="number" step="1000" min="0" defaultValue={saved} className="w-44 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5" />
                </label>
                <button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">Lưu</button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
