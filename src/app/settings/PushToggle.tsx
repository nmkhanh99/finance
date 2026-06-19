"use client";

import { useEffect, useState } from "react";
import { saveSubscription, deleteSubscription, sendTestPush } from "./actions";

function urlB64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setSubscribed(!!sub);
    });
  }, []);

  async function enable() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Bạn đã từ chối quyền thông báo.");
        return;
      }
      const res = await fetch("/api/push/vapid");
      if (!res.ok) {
        setMsg("Server chưa cấu hình VAPID (đặt VAPID_PUBLIC_KEY/PRIVATE_KEY).");
        return;
      }
      const key = (await res.text()).trim();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(key),
      });
      const j = sub.toJSON();
      const r = await saveSubscription({
        endpoint: sub.endpoint,
        p256dh: j.keys?.p256dh ?? "",
        auth: j.keys?.auth ?? "",
      });
      if (r.ok) {
        setSubscribed(true);
        setMsg("Đã bật thông báo đẩy trên thiết bị này.");
      } else {
        setMsg("Không lưu được đăng ký.");
      }
    } catch (e) {
      setMsg("Lỗi: " + (e instanceof Error ? e.message : "không rõ"));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await deleteSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Đã tắt thông báo đẩy.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg("");
    const r = await sendTestPush();
    setMsg(r.msg);
    setBusy(false);
  }

  if (!supported) {
    return <p className="text-sm text-amber-400">Trình duyệt này không hỗ trợ thông báo đẩy.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {subscribed ? (
          <button onClick={disable} disabled={busy} className="rounded-lg border border-black/15 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50">
            Tắt thông báo đẩy
          </button>
        ) : (
          <button onClick={enable} disabled={busy} className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50">
            Bật thông báo đẩy trên thiết bị này
          </button>
        )}
        {subscribed && (
          <button onClick={test} disabled={busy} className="rounded-lg border border-black/15 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50">
            Gửi thử
          </button>
        )}
      </div>
      {msg && <p className="text-xs text-gray-500 dark:text-gray-400">{msg}</p>}
    </div>
  );
}
