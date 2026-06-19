import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readUserSessionId } from "./auth";

/**
 * SEAM duy nhất để xác định người dùng hiện tại.
 * Hôm nay: đọc userId từ cookie phiên (đăng nhập bằng username).
 * Sau này cắm Keycloak/OIDC: chỉ đổi thân hàm này (vd validate access token,
 * map `sub` -> User.externalId) — toàn bộ query phía sau dùng `requireUserId()` không phải sửa.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const jar = await cookies();
  return readUserSessionId(jar.get(SESSION_COOKIE)?.value);
}

/** Bắt buộc có phiên; nếu không -> chuyển về /login. Dùng ở mọi page/action dữ liệu cá nhân. */
export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) redirect("/login");
  return id;
}
