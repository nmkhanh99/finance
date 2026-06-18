import { describe, it, expect } from "vitest";
import {
  signToken,
  verifyToken,
  createSession,
  isSessionValid,
  verifyPassword,
  timingSafeEqual,
} from "./auth";

const SECRET = "test-secret-123";

describe("token sign/verify", () => {
  it("round-trip hợp lệ", async () => {
    const t = await signToken("hello", SECRET);
    expect(await verifyToken(t, SECRET)).toBe("hello");
  });
  it("sai secret -> null", async () => {
    const t = await signToken("hello", SECRET);
    expect(await verifyToken(t, "other-secret")).toBeNull();
  });
  it("giả mạo payload -> null", async () => {
    const t = await signToken("hello", SECRET);
    const tampered = "evil" + t.slice(t.indexOf("."));
    expect(await verifyToken(tampered, SECRET)).toBeNull();
  });
});

describe("session", () => {
  it("còn hạn -> valid", async () => {
    const now = 1_000_000;
    const s = await createSession(SECRET, now, 10_000);
    expect(await isSessionValid(s, SECRET, now + 5_000)).toBe(true);
  });
  it("hết hạn -> invalid", async () => {
    const now = 1_000_000;
    const s = await createSession(SECRET, now, 10_000);
    expect(await isSessionValid(s, SECRET, now + 20_000)).toBe(false);
  });
  it("không token -> invalid", async () => {
    expect(await isSessionValid(undefined, SECRET)).toBe(false);
  });
});

describe("password & timingSafeEqual", () => {
  it("đúng/sai mật khẩu", () => {
    expect(verifyPassword("abc", "abc")).toBe(true);
    expect(verifyPassword("abc", "abd")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false); // không cho mật khẩu rỗng
  });
  it("timingSafeEqual", () => {
    expect(timingSafeEqual("a", "a")).toBe(true);
    expect(timingSafeEqual("a", "ab")).toBe(false);
  });
});
