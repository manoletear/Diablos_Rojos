"use client";

import { useState } from "react";
import { generarClaveEmergencia } from "./actions";

export default function ClaveEmergenciaBoton({ tabla, filaId }: { tabla: "entrenadores" | "apoderados"; filaId: string }) {
  const [estado, setEstado] = useState<"idle" | "generando" | "error">("idle");
  const [password, setPassword] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (password) {
    return (
      <div className="rounded-md border border-warning bg-warning-bg px-2 py-1 text-xs">
        <div className="font-mono font-semibold text-neutral-900">{password}</div>
        <div className="text-neutral-500">Pásasela a mano — no queda guardada, no se vuelve a mostrar.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={estado === "generando"}
        onClick={async () => {
          setEstado("generando");
          setErrorMsg(null);
          const r = await generarClaveEmergencia(tabla, filaId);
          if (r.ok && r.password) {
            setPassword(r.password);
            setEstado("idle");
          } else {
            setErrorMsg(r.error ?? "Error desconocido");
            setEstado("error");
          }
        }}
        className="text-xs font-medium text-warning hover:underline disabled:opacity-50"
        title="Úsalo si el correo de invitación/magic link no le llegó"
      >
        {estado === "generando" ? "Generando..." : "Clave de emergencia"}
      </button>
      {errorMsg && <div className="text-xs text-error">{errorMsg}</div>}
    </div>
  );
}
