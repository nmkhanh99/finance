import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { unrealizedPnL } from "@/lib/finance";
import { convertToBase } from "@/lib/currency";
import { createHolding, updatePrice, deleteHolding, refreshPrices } from "./actions";
import PriceChart, { type PricePoint } from "./PriceChart";

export const dynamic = "force-dynamic";

const ASSET_LABEL: Record<string, string> = { STOCK: "Chứng khoán", CRYPTO: "Tiền ảo" };

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(d);
}

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; skipped?: string; error?: string; symbol?: string }>;
}) {
  const sp = await searchParams;
  const [holdings, rateRows] = await Promise.all([
    prisma.holding.findMany({
      orderBy: { createdAt: "asc" },
      include: { prices: { orderBy: { at: "desc" }, take: 1 } },
    }),
    prisma.exchangeRate.findMany(),
  ]);
  const rates: Record<string, number> = {};
  for (const r of rateRows) rates[r.code] = Number(r.rate);

  // Mã được chọn để xem lịch sử giá
  const selected = holdings.find((h) => h.symbol === sp.symbol) ?? holdings[0];
  const history = selected
    ? await prisma.priceSnapshot.findMany({
        where: { holdingId: selected.id },
        orderBy: { at: "asc" },
        take: 200,
      })
    : [];
  const pricePoints: PricePoint[] = history.map((s) => ({
    t: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(s.at),
    price: Number(s.price),
  }));

  const rows = holdings.map((h) => {
    const qty = Number(h.quantity);
    const avgCost = Number(h.avgCost);
    const latest = h.prices[0];
    const currentPrice = latest ? Number(latest.price) : avgCost;
    const pnl = unrealizedPnL(qty, currentPrice, avgCost);
    return { h, qty, avgCost, currentPrice, hasPrice: !!latest, priceAt: latest?.at, pnl };
  });

  // Tổng quy đổi về VND (mỗi holding có thể khác tiền tệ)
  const totalMarket = rows.reduce((s, r) => s + convertToBase(r.pnl.marketValue, r.h.currency, rates), 0);
  const totalCost = rows.reduce((s, r) => s + convertToBase(r.pnl.costBasis, r.h.currency, rates), 0);
  const totalPnL = totalMarket - totalCost;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">Đầu tư</h1>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm text-gray-400">
            Giá trị TT (VND):{" "}
            <span className="font-semibold text-amber-400">{formatMoney(totalMarket)}</span>
            <span className="mx-2">·</span>
            Lãi/lỗ:{" "}
            <span className={`font-semibold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalPnL >= 0 ? "+" : ""}
              {formatMoney(totalPnL)}
            </span>
          </div>
          {rows.length > 0 && (
            <form action={refreshPrices}>
              <button className="rounded-lg border border-sky-500/40 px-3 py-1.5 text-sm text-sky-400 hover:bg-sky-500/10">
                ↻ Cập nhật giá
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Banner kết quả cập nhật giá */}
      {sp.updated !== undefined && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            sp.error
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {sp.error
            ? `Lỗi cập nhật giá: ${sp.error}`
            : `Đã cập nhật ${sp.updated} mã từ CoinGecko.`}
          {sp.skipped ? ` Bỏ qua (chưa hỗ trợ): ${sp.skipped}.` : ""}
        </div>
      )}

      {/* Form thêm holding */}
      <form
        action={createHolding}
        className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-6"
      >
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Mã</span>
          <input
            name="symbol"
            required
            placeholder="VNM / BTC"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 uppercase"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Loại</span>
          <select name="assetType" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <option value="STOCK">Chứng khoán</option>
            <option value="CRYPTO">Tiền ảo</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Số lượng</span>
          <input
            name="quantity"
            type="number"
            step="any"
            min="0"
            required
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Giá vốn / đơn vị</span>
          <input
            name="avgCost"
            type="number"
            step="any"
            min="0"
            required
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-400">Tiền tệ</span>
          <input name="currency" defaultValue="VND" maxLength={5} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 uppercase" />
        </label>
        <button className="self-end rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">
          + Thêm / Mua thêm
        </button>
      </form>
      <p className="-mt-5 text-xs text-gray-500">
        Thêm cùng mã + loại đã có sẽ tự gộp và tính lại giá vốn trung bình.
      </p>

      {/* Bảng holdings */}
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-gray-400">Chưa có khoản đầu tư nào.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400">
              <tr className="border-b border-white/10">
                <th className="py-2 pr-3">Mã</th>
                <th className="py-2 pr-3">SL</th>
                <th className="py-2 pr-3">Giá vốn</th>
                <th className="py-2 pr-3">Giá hiện tại</th>
                <th className="py-2 pr-3 text-right">Giá trị TT</th>
                <th className="py-2 pr-3 text-right">Lãi/Lỗ</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ h, qty, avgCost, currentPrice, hasPrice, priceAt, pnl }) => (
                <tr key={h.id} className="border-b border-white/5">
                  <td className="py-3 pr-3">
                    <div className="font-medium">{h.symbol}</div>
                    <div className="text-xs text-gray-500">{ASSET_LABEL[h.assetType]}</div>
                  </td>
                  <td className="py-3 pr-3">{qty}</td>
                  <td className="py-3 pr-3">{formatMoney(avgCost, h.currency)}</td>
                  <td className="py-3 pr-3">
                    <form action={updatePrice} className="flex items-center gap-1">
                      <input type="hidden" name="holdingId" value={h.id} />
                      <input
                        name="price"
                        type="number"
                        step="any"
                        min="0"
                        defaultValue={currentPrice}
                        className="w-28 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-right"
                      />
                      <button
                        title="Cập nhật giá"
                        className="rounded-lg border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
                      >
                        ↻
                      </button>
                      {!hasPrice && <span className="text-xs text-gray-500">(= giá vốn)</span>}
                    </form>
                    {priceAt && (
                      <div className="mt-0.5 text-[10px] text-gray-500">{formatTime(priceAt)}</div>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right">{formatMoney(pnl.marketValue, h.currency)}</td>
                  <td
                    className={`py-3 pr-3 text-right font-medium ${
                      pnl.amount >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {pnl.amount >= 0 ? "+" : ""}
                    {formatMoney(pnl.amount, h.currency)}
                    <div className="text-xs font-normal">
                      {pnl.percent >= 0 ? "+" : ""}
                      {pnl.percent}%
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <form action={deleteHolding}>
                      <input type="hidden" name="id" value={h.id} />
                      <button className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10">
                        Xoá
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Lịch sử giá */}
      {selected && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-medium text-gray-300">Lịch sử giá</h2>
            <div className="flex flex-wrap gap-1">
              {holdings.map((h) => (
                <Link
                  key={h.id}
                  href={`/investments?symbol=${h.symbol}`}
                  className={`rounded-lg px-2.5 py-1 text-xs ${
                    h.id === selected.id ? "bg-amber-400 text-black" : "border border-white/15 hover:bg-white/10"
                  }`}
                >
                  {h.symbol}
                </Link>
              ))}
            </div>
          </div>
          {pricePoints.length >= 2 ? (
            <PriceChart data={pricePoints} symbol={selected.symbol} />
          ) : (
            <p className="rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-gray-400">
              {selected.symbol}: chưa đủ dữ liệu giá. Bấm "↻ Cập nhật giá" hoặc nhập giá thủ công nhiều lần để vẽ biểu đồ.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
