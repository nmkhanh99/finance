import { prisma } from "./db";
import { Prisma } from "@prisma/client";

/** Map mã crypto phổ biến -> CoinGecko coin id. Bổ sung thêm khi cần. */
export const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  TRX: "tron",
  TON: "the-open-network",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  MATIC: "matic-network",
  LINK: "chainlink",
  NEAR: "near",
  PEPE: "pepe",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  UNI: "uniswap",
  ATOM: "cosmos",
  ETC: "ethereum-classic",
  XLM: "stellar",
  XMR: "monero",
  FIL: "filecoin",
  APT: "aptos",
  SUI: "sui",
  ARB: "arbitrum",
  OP: "optimism",
  IMX: "immutable-x",
  INJ: "injective-protocol",
  SEI: "sei-network",
  FTM: "fantom",
  ALGO: "algorand",
  VET: "vechain",
  HBAR: "hedera-hashgraph",
  AAVE: "aave",
  MKR: "maker",
  GRT: "the-graph",
  SAND: "the-sandbox",
  MANA: "decentraland",
  AXS: "axie-infinity",
  CRO: "crypto-com-chain",
  QNT: "quant-network",
  KAS: "kaspa",
  TIA: "celestia",
  STX: "blockstack",
  RNDR: "render-token",
  FET: "fetch-ai",
  WIF: "dogwifcoin",
  BONK: "bonk",
  JUP: "jupiter-exchange-solana",
  ENA: "ethena",
};

/**
 * CoinGecko coin id cho 1 holding: ưu tiên `priceId` tùy chỉnh, fallback map theo symbol.
 * null nếu không xác định được (sẽ bị skip khi cập nhật giá).
 */
export function resolveCoinId(symbol: string, priceId?: string | null): string | null {
  const custom = priceId?.trim().toLowerCase();
  if (custom) return custom;
  return CRYPTO_IDS[symbol.trim().toUpperCase()] ?? null;
}

/** Lấy giá (VND) theo danh sách CoinGecko id. Ném lỗi nếu request fail. */
export async function fetchCryptoPricesVND(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=vnd`;
  const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, { vnd?: number }>;
  const out: Record<string, number> = {};
  for (const id of ids) {
    const p = data[id]?.vnd;
    if (typeof p === "number") out[id] = p;
  }
  return out;
}

/**
 * Giá cổ phiếu VN (VND) từ VNDirect dchart (UDF). Trả null nếu không có dữ liệu.
 * dchart trả giá theo NGHÌN VND (VNM 59.2 = 59.200đ) -> nhân 1000.
 */
export async function fetchStockPriceVND(symbol: string): Promise<number | null> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 14 * 24 * 60 * 60; // 14 ngày gần nhất
  const url = `https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=${encodeURIComponent(
    symbol,
  )}&from=${from}&to=${to}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      // VNDirect chặn request thiếu User-Agent kiểu trình duyệt (trả 406)
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      referer: "https://dchart.vndirect.com.vn/",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`VNDirect HTTP ${res.status}`);
  const data = (await res.json()) as { s?: string; c?: number[] };
  if (data.s !== "ok" || !Array.isArray(data.c) || data.c.length === 0) return null;
  const last = data.c[data.c.length - 1];
  return typeof last === "number" ? last * 1000 : null;
}

export interface RefreshResult {
  updated: number;
  skipped: string[]; // mã không lấy được giá
  error?: string;
}

/** Cập nhật giá thị trường cho holding crypto -> ghi PriceSnapshot. Không ném lỗi.
 *  userId: truyền -> chỉ holding của user đó; bỏ trống -> mọi user (cron). */
export async function refreshCryptoPrices(userId?: string): Promise<RefreshResult> {
  const holdings = await prisma.holding.findMany({
    where: { assetType: "CRYPTO", ...(userId ? { userId } : {}) },
  });
  // Mỗi holding tự xác định coin id (priceId tùy chỉnh > map theo symbol).
  const resolved = holdings.map((h) => ({ h, id: resolveCoinId(h.symbol, h.priceId) }));
  const skipped = resolved.filter((r) => !r.id).map((r) => r.h.symbol);

  const ids = [...new Set(resolved.map((r) => r.id).filter((x): x is string => !!x))];
  if (ids.length === 0) return { updated: 0, skipped };

  try {
    const prices = await fetchCryptoPricesVND(ids);
    let updated = 0;
    for (const { h, id } of resolved) {
      const price = id ? prices[id] : undefined;
      if (price == null) continue;
      await prisma.priceSnapshot.create({
        data: { holdingId: h.id, price: new Prisma.Decimal(price) },
      });
      updated++;
    }
    return { updated, skipped };
  } catch (e) {
    return { updated: 0, skipped, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

/** Cập nhật giá cho holding chứng khoán VN -> ghi PriceSnapshot. Không ném lỗi.
 *  userId: truyền -> chỉ holding của user đó; bỏ trống -> mọi user (cron). */
export async function refreshStockPrices(userId?: string): Promise<RefreshResult> {
  const holdings = await prisma.holding.findMany({
    where: { assetType: "STOCK", ...(userId ? { userId } : {}) },
  });
  if (holdings.length === 0) return { updated: 0, skipped: [] };

  const skipped: string[] = [];
  let updated = 0;
  try {
    for (const h of holdings) {
      const price = await fetchStockPriceVND(h.symbol);
      if (price == null) {
        skipped.push(h.symbol);
        continue;
      }
      await prisma.priceSnapshot.create({
        data: { holdingId: h.id, price: new Prisma.Decimal(price) },
      });
      updated++;
    }
    return { updated, skipped };
  } catch (e) {
    return { updated, skipped, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

/** Cập nhật cả crypto (CoinGecko) lẫn chứng khoán VN (VNDirect).
 *  userId: truyền -> chỉ holding của user đó; bỏ trống -> mọi user (cron). */
export async function refreshAllPrices(userId?: string): Promise<RefreshResult> {
  const [c, s] = await Promise.all([refreshCryptoPrices(userId), refreshStockPrices(userId)]);
  return {
    updated: c.updated + s.updated,
    skipped: [...c.skipped, ...s.skipped],
    error: c.error || s.error,
  };
}
