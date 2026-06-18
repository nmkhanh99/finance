"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AssetType, Prisma } from "@prisma/client";
import { weightedAvgCost } from "@/lib/finance";
import { refreshAllPrices } from "@/lib/prices";

/** Thêm holding mới; nếu đã có (cùng symbol + loại) thì gộp & tính lại giá vốn TB. */
export async function createHolding(formData: FormData) {
  const symbol = String(formData.get("symbol") ?? "").trim().toUpperCase();
  const assetType = String(formData.get("assetType") ?? "STOCK") as AssetType;
  const quantity = Number(formData.get("quantity") ?? 0);
  const avgCost = Number(formData.get("avgCost") ?? 0);
  if (!symbol || quantity <= 0 || avgCost < 0) return;

  const existing = await prisma.holding.findUnique({
    where: { symbol_assetType: { symbol, assetType } },
  });

  if (existing) {
    const newAvg = weightedAvgCost(Number(existing.quantity), Number(existing.avgCost), quantity, avgCost);
    await prisma.holding.update({
      where: { id: existing.id },
      data: {
        quantity: { increment: new Prisma.Decimal(quantity) },
        avgCost: new Prisma.Decimal(newAvg),
      },
    });
  } else {
    await prisma.holding.create({
      data: { symbol, assetType, quantity, avgCost, currency: "VND" },
    });
  }
  revalidatePath("/investments");
  revalidatePath("/");
}

/** Cập nhật giá thị trường hiện tại (tạo 1 PriceSnapshot mới). */
export async function updatePrice(formData: FormData) {
  const holdingId = String(formData.get("holdingId") ?? "");
  const price = Number(formData.get("price") ?? 0);
  if (!holdingId || price < 0) return;

  await prisma.priceSnapshot.create({
    data: { holdingId, price: new Prisma.Decimal(price) },
  });
  revalidatePath("/investments");
  revalidatePath("/");
}

/** Tự cập nhật giá (crypto + chứng khoán VN) rồi hiển thị kết quả qua query param. */
export async function refreshPrices() {
  const r = await refreshAllPrices();
  revalidatePath("/investments");
  revalidatePath("/");
  const q = new URLSearchParams({ updated: String(r.updated), skipped: r.skipped.join(",") });
  if (r.error) q.set("error", r.error);
  redirect(`/investments?${q.toString()}`);
}

export async function deleteHolding(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.holding.delete({ where: { id } });
  revalidatePath("/investments");
  revalidatePath("/");
}
