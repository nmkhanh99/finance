import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authEnabled, sessionValid, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next(); // auth tắt khi chưa đặt AUTH_PASSWORD

  const { pathname, searchParams } = req.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  // Cron: cho phép /api/* nếu ?key=CRON_SECRET khớp
  const cronSecret = process.env.CRON_SECRET;
  if (pathname.startsWith("/api/") && cronSecret && searchParams.get("key") === cronSecret) {
    return NextResponse.next();
  }

  if (await sessionValid(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

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
