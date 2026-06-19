import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { settle, type Balance } from "@/lib/split";
import { addMember, deleteMember, deleteExpense, deleteGroup } from "../actions";
import ExpenseForm from "./ExpenseForm";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.tripGroup.findUnique({
    where: { id },
    include: {
      members: { orderBy: { createdAt: "asc" } },
      expenses: {
        orderBy: { date: "desc" },
        include: { payer: true, shares: { include: { member: true } } },
      },
    },
  });
  if (!group) notFound();

  const nameById = new Map(group.members.map((m) => [m.id, m.name]));

  // Tính paid / owed / net mỗi người
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();
  for (const m of group.members) {
    paid.set(m.id, 0);
    owed.set(m.id, 0);
  }
  let total = 0;
  for (const e of group.expenses) {
    const amt = Number(e.amount);
    total += amt;
    paid.set(e.payerId, (paid.get(e.payerId) ?? 0) + amt);
    for (const s of e.shares) {
      owed.set(s.memberId, (owed.get(s.memberId) ?? 0) + Number(s.amount));
    }
  }
  const balances: Balance[] = group.members.map((m) => {
    const p = paid.get(m.id) ?? 0;
    const o = owed.get(m.id) ?? 0;
    return { id: m.id, name: m.name, paid: p, owed: o, net: p - o };
  });
  const transfers = settle(balances);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/trips" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">← Tất cả nhóm</Link>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tổng chi: <span className="font-semibold text-amber-400">{formatMoney(total)}</span>
            {group.members.length > 0 ? ` · ${group.members.length} thành viên` : ""}
          </div>
        </div>
        <form action={deleteGroup}>
          <input type="hidden" name="id" value={group.id} />
          <button className="rounded-lg border border-red-500/30 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10">Xoá nhóm</button>
        </form>
      </div>

      {/* Thành viên */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Thành viên</h2>
        <div className="flex flex-wrap gap-2">
          {group.members.map((m) => (
            <span key={m.id} className="flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 px-3 py-1 text-sm">
              {m.name}
              <form action={deleteMember}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="groupId" value={group.id} />
                <button className="text-red-400 hover:text-red-300" title="Xoá">×</button>
              </form>
            </span>
          ))}
        </div>
        <form action={addMember} className="flex items-end gap-2">
          <input type="hidden" name="groupId" value={group.id} />
          <input name="name" required placeholder="Tên thành viên" className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 px-3 py-2 text-sm" />
          <button className="rounded-lg border border-black/15 dark:border-white/15 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">+ Thêm</button>
        </form>
      </section>

      {/* Thêm chi phí */}
      {group.members.length >= 1 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Thêm chi phí</h2>
          <ExpenseForm groupId={group.id} members={group.members} />
        </section>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Thêm ít nhất 1 thành viên để bắt đầu ghi chi phí.</p>
      )}

      {/* Danh sách chi phí */}
      {group.expenses.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Các khoản chi ({group.expenses.length})</h2>
          {group.expenses.map((e) => (
            <div key={e.id} className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{e.description}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(e.date)} · <span className="text-sky-400">{e.payer.name}</span> trả ·
                    chia cho {e.shares.map((s) => s.member.name).join(", ")}
                    {e.splitType === "CUSTOM" ? " (tùy chỉnh)" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-amber-400">{formatMoney(Number(e.amount))}</span>
                  <form action={deleteExpense}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="groupId" value={group.id} />
                    <button className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10">Xoá</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Báo cáo phân tích */}
      {group.expenses.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Báo cáo phân tích</h2>
          <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 dark:text-gray-400">
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="px-4 py-2">Thành viên</th>
                  <th className="px-4 py-2 text-right">Đã trả</th>
                  <th className="px-4 py-2 text-right">Phải chịu</th>
                  <th className="px-4 py-2 text-right">Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.id} className="border-b border-black/5 dark:border-white/5">
                    <td className="px-4 py-2">{b.name}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(b.paid)}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(b.owed)}</td>
                    <td className={`px-4 py-2 text-right font-medium ${b.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {b.net >= 0 ? "+" : ""}
                      {formatMoney(b.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-500">Chênh lệch dương: nhóm nợ bạn. Âm: bạn cần trả lại nhóm.</p>

          {/* Phương án thanh toán */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Phương án thanh toán (tối thiểu)</h3>
            {transfers.length === 0 ? (
              <p className="text-sm text-emerald-400">✓ Đã cân bằng, không ai cần chuyển tiền.</p>
            ) : (
              transfers.map((t, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 px-4 py-2 text-sm">
                  <span className="font-medium text-red-400">{t.fromName}</span>
                  <span className="text-gray-500 dark:text-gray-400">chuyển</span>
                  <span className="font-semibold">{formatMoney(t.amount)}</span>
                  <span className="text-gray-500 dark:text-gray-400">cho</span>
                  <span className="font-medium text-emerald-400">{t.toName}</span>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
