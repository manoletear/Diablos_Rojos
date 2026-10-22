"use client";

import { useState } from "react";
import { reenviarInvitacion } from "./actions";

export default function ReenviarBoton({ tabla, email }: { tabla: "entrenadores" | "apoderados"; email: string }) {
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");

  return (
    <button
      type="button"
      disabled={estado === "enviando"}
      onClick={async () => {
        setEstado("enviando");
        const r = await reenviarInvitacion(tabla, email);
        setEstado(r.ok ? "ok" : "error");
      }}
      className="text-xs font-medium text-primary-600 hover:underline disabled:opacity-50"
    >
      {estado === "enviando" ? "Enviando..." : estado === "ok" ? "Enviada ✓" : estado === "error" ? "Error, reintentar" : "Reenviar"}
    </button>
  );
}
