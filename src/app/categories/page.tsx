import { prisma } from "@/lib/db";
import { createCategory, renameCategory, deleteCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });
  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");

  function List({ items, title }: { items: typeof categories; title: string }) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-gray-300">{title}</h2>
        {items.length === 0 && <p className="text-sm text-gray-400">Chưa có danh mục.</p>}
        {items.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2"
          >
            <form action={renameCategory} className="flex items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input
                name="name"
                defaultValue={c.name}
                className="w-44 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm"
              />
              <button className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10">Lưu</button>
            </form>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{c._count.transactions} giao dịch</span>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10">
                  Xoá
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Danh mục</h1>

      <form
        action={createCategory}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
      >
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Tên danh mục</span>
          <input name="name" required placeholder="VD: Cà phê" className="w-56 rounded-lg border border-white/10 bg-black/30 px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Loại</span>
          <select name="type" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <option value="EXPENSE">Chi</option>
            <option value="INCOME">Thu</option>
          </select>
        </label>
        <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">+ Thêm</button>
      </form>

      <p className="-mt-4 text-xs text-gray-500">
        Xoá danh mục sẽ gỡ nó khỏi các giao dịch đang dùng (giao dịch vẫn còn, chỉ mất nhãn danh mục).
      </p>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <List items={expense} title="Chi" />
        <List items={income} title="Thu" />
      </div>
    </div>
  );
}
