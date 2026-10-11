"use client";

import { useState, useTransition } from "react";
import { toggleConvocado } from "@/app/dashboard/partidos/actions";
import type { ResumenNotificacion } from "@/lib/notificaciones";

function resumenTexto(r: ResumenNotificacion) {
  const partes = [
    `In-app: enviado`,
    r.push.enviados > 0 ? "Push: enviado" : `Push: ${r.push.motivoFallo ?? "sin enviar"}`,
    r.email.enviados > 0 ? "Email: enviado" : `Email: ${r.email.motivoFallo ?? "sin enviar"}`,
  ];
  return partes.join(" · ");
}

export function ConvocarToggle({ partidoId, alumnoId, convocado }: { partidoId: string; alumnoId: string; convocado: boolean }) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  function onClick() {
    setResultado(null);
    startTransition(async () => {
      const r = await toggleConvocado(partidoId, alumnoId, !convocado);
      if (r) setResultado(resumenTexto(r));
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className={`rounded-full px-3 py-1 text-xs font-medium ${convocado ? "bg-success-bg text-success" : "bg-neutral-100 text-neutral-500"} disabled:opacity-50`}
      >
        {pending ? "..." : convocado ? "✓ Convocado" : "Convocar"}
      </button>
      {resultado && <div className="mt-1 max-w-[220px] text-[10px] leading-tight text-neutral-400">{resultado}</div>}
    </div>
  );
}
