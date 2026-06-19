import { describe, it, expect } from "vitest";
import { resolveCoinId, CRYPTO_IDS } from "./prices";

describe("resolveCoinId", () => {
  it("ưu tiên priceId tùy chỉnh, chuẩn hoá lowercase/trim", () => {
    expect(resolveCoinId("BTC", "My-Coin")).toBe("my-coin");
    expect(resolveCoinId("XYZ", "  some-token ")).toBe("some-token");
  });
  it("fallback map theo symbol (không phân biệt hoa thường)", () => {
    expect(resolveCoinId("btc")).toBe("bitcoin");
    expect(resolveCoinId("ETH", "")).toBe("ethereum");
    expect(resolveCoinId("SOL", "   ")).toBe("solana");
  });
  it("không có priceId & không trong map -> null", () => {
    expect(resolveCoinId("UNKNOWNCOIN")).toBeNull();
    expect(resolveCoinId("FOO", null)).toBeNull();
  });
  it("map đã mở rộng (coin phổ biến mới)", () => {
    expect(CRYPTO_IDS.ATOM).toBe("cosmos");
    expect(CRYPTO_IDS.ARB).toBe("arbitrum");
    expect(CRYPTO_IDS.SUI).toBe("sui");
    expect(CRYPTO_IDS.TIA).toBe("celestia");
  });
});
