/**
 * Auth tối giản cho app self-host single-user — KHÔNG thêm dependency.
 * Cookie phiên = `${exp}.${HMAC-SHA256(secret, exp)}` (Web Crypto, chạy cả Edge & Node).
 * Bật khi đặt env AUTH_PASSWORD; nếu không, auth tắt (giữ tương thích chạy local).
 */

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày
export const SESSION_COOKIE = "fin_session";

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toHex(sig);
}

/** So sánh chuỗi thời gian-hằng (tránh timing attack). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ----- Core (nhận secret tường minh — dễ unit-test) -----

export async function signToken(payload: string, secret: string): Promise<string> {
  return `${payload}.${await hmacHex(secret, payload)}`;
}

export async function verifyToken(token: string, secret: string): Promise<string | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(secret, payload);
  return timingSafeEqual(sig, expected) ? payload : null;
}

export async function createSession(secret: string, now = Date.now(), ttl = SESSION_TTL_MS): Promise<string> {
  return signToken(String(now + ttl), secret);
}

export async function isSessionValid(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const payload = await verifyToken(token, secret);
  if (!payload) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && exp > now;
}

export function verifyPassword(input: string, expected: string): boolean {
  return expected.length > 0 && timingSafeEqual(input, expected);
}

// ----- Wrapper đọc env -----

export function authEnabled(): boolean {
  return !!process.env.AUTH_PASSWORD;
}

function secret(): string {
  return process.env.AUTH_SECRET || process.env.AUTH_PASSWORD || "dev-insecure-secret";
}

export function createSessionCookie(): Promise<string> {
  return createSession(secret());
}

export function sessionValid(token: string | undefined): Promise<boolean> {
  return isSessionValid(token, secret());
}

export function checkPassword(input: string): boolean {
  return verifyPassword(input, process.env.AUTH_PASSWORD ?? "");
}
