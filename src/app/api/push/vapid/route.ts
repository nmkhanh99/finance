import { NextResponse } from "next/server";
import { pushEnabled, vapidPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

/** Trả VAPID public key (text) cho client đăng ký push. 503 nếu chưa cấu hình. */
export async function GET() {
  if (!pushEnabled()) return NextResponse.json({ error: "Push chưa cấu hình" }, { status: 503 });
  return new NextResponse(vapidPublicKey(), { headers: { "Content-Type": "text/plain" } });
}
