"use client";

import { useEffect, useState } from "react";
import { guardarPushSubscription } from "@/app/dashboard/notificaciones/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushSubscribeButton() {
  const [estado, setEstado] = useState<"idle" | "activando" | "activo" | "no_soportado" | "error">(() =>
    typeof window !== "undefined" && (!("serviceWorker" in navigator) || !("PushManager" in window)) ? "no_soportado" : "idle"
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      if (sub) setEstado("activo");
    });
  }, []);

  async function activar() {
    setEstado("activando");
    try {
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublic) throw new Error("Push no configurado");

      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") throw new Error("Permiso denegado");

      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });

      await guardarPushSubscription(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
      setEstado("activo");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "no_soportado") return null;
  if (estado === "activo") {
    return <span className="text-xs font-medium text-white/90">🔔 Notificaciones push activas</span>;
  }

  return (
    <button
      onClick={activar}
      disabled={estado === "activando"}
      className="rounded-md border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
    >
      {estado === "activando" ? "Activando..." : estado === "error" ? "Reintentar activar notificaciones" : "🔔 Activar notificaciones push"}
    </button>
  );
}
