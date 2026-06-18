import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { createGroup } from "./actions";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const groups = await prisma.tripGroup.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: true,
      expenses: { select: { amount: true } },
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Chia tiền nhóm</h1>

      <form
        action={createGroup}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
      >
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Tên nhóm / chuyến đi</span>
          <input name="name" required placeholder="VD: Đà Lạt 6/2026" className="w-64 rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Ghi chú (tuỳ chọn)</span>
          <input name="note" className="w-64 rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
        </label>
        <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">+ Tạo nhóm</button>
      </form>

      <div className="space-y-2">
        {groups.length === 0 && <p className="text-gray-400">Chưa có nhóm nào.</p>}
        {groups.map((g) => {
          const total = g.expenses.reduce((s, e) => s + Number(e.amount), 0);
          return (
            <Link
              key={g.id}
              href={`/trips/${g.id}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"
            >
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-gray-400">
                  {g.members.length} thành viên · {g.expenses.length} chi phí
                  {g.note ? ` · ${g.note}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Tổng chi</div>
                <div className="font-semibold text-amber-400">{formatMoney(total)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
