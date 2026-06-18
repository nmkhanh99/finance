"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, {} as LoginState);

  return (
    <form action={action} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-xl font-semibold">Đăng nhập</h1>
      <label className="flex flex-col text-sm">
        <span className="mb-1 text-gray-400">Mật khẩu</span>
        <input
          name="password"
          type="password"
          autoFocus
          required
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
        />
      </label>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
      >
        {pending ? "Đang vào..." : "Vào app"}
      </button>
    </form>
  );
}
