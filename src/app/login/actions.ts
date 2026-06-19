"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createUserSessionCookie, SESSION_COOKIE } from "@/lib/auth";
import { seedDefaultCategories } from "@/lib/userSetup";

export interface LoginState {
  error?: string;
}

const USERNAME_RE = /^[a-z0-9_.-]{2,30}$/;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!username) return { error: "Nhập tên đăng nhập." };
  if (!USERNAME_RE.test(username)) {
    return { error: "Tên 2–30 ký tự: chữ thường, số, dấu . _ -" };
  }

  // Chưa có mật khẩu: gõ username -> vào user đó, tạo mới nếu chưa tồn tại.
  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    user = await prisma.user.create({ data: { username } });
    await seedDefaultCategories(user.id); // user mới có sẵn danh mục thu/chi
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createUserSessionCookie(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
