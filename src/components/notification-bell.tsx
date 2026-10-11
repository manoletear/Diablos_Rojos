"use client";

import { useState, useTransition } from "react";
import { marcarNotificacionLeida } from "@/app/dashboard/notificaciones/actions";

export type NotificacionItem = {
  id: string;
  cuerpo: string;
  created_at: string;
  leido_en: string | null;
};

export function NotificationBell({ notificaciones }: { notificaciones: NotificacionItem[] }) {
  const [abierto, setAbierto] = useState(false);
  const [pending, startTransition] = useTransition();
  const noLeidas = notificaciones.filter((n) => !n.leido_en).length;

  return (
    <div className="relative">
      <button
        aria-label="Notificaciones"
        onClick={() => setAbierto((v) => !v)}
        className="relative rounded-full p-2 hover:bg-white/10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-dr-neutral-900 text-[10px] font-bold text-white">
            {noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-neutral-200 bg-white text-dr-neutral-900 shadow-lg">
          <div className="border-b border-neutral-200 px-4 py-2 text-xs font-semibold uppercase text-neutral-500">
            Notificaciones
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-neutral-400">Sin notificaciones</div>
            ) : (
              notificaciones.map((n) => (
                <button
                  key={n.id}
                  disabled={pending}
                  onClick={() => startTransition(() => marcarNotificacionLeida(n.id))}
                  className={`block w-full border-b border-neutral-100 px-4 py-3 text-left text-sm hover:bg-neutral-50 ${!n.leido_en ? "bg-primary-50" : ""}`}
                >
                  <div className="text-neutral-700">{n.cuerpo}</div>
                  <div className="mt-1 text-xs text-neutral-400">
                    {new Date(n.created_at).toLocaleString("es-CL")}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
