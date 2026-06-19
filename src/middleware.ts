import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readUserSessionId, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  // Cron: cho phép /api/* nếu ?key=CRON_SECRET khớp (chạy đa người dùng, không cần phiên).
  const cronSecret = process.env.CRON_SECRET;
  if (pathname.startsWith("/api/") && cronSecret && searchParams.get("key") === cronSecret) {
    return NextResponse.next();
  }

  // Yêu cầu phiên hợp lệ (cookie ký HMAC mang userId). Không truy vấn DB ở Edge.
  if (await readUserSessionId(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  // chặn mọi route trừ tài nguyên tĩnh của Next
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
