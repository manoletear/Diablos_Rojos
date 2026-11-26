"use client";

import { useState, useTransition } from "react";
import { confirmarConvocatoria } from "@/app/dashboard/partidos/actions";

export function ConfirmarConvocatoria({ convocatoriaId, alumnoId }: { convocatoriaId: string; alumnoId: string }) {
  const [pending, startTransition] = useTransition();
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function enviar(confirma: boolean, motivoTexto?: string) {
    setError(null);
    startTransition(async () => {
      const r = await confirmarConvocatoria(convocatoriaId, alumnoId, confirma, motivoTexto);
      if (!r.ok) {
        setError(r.error ?? "No se pudo registrar la respuesta.");
      } else {
        setPidiendoMotivo(false);
      }
    });
  }

  if (pidiendoMotivo) {
    return (
      <div className="flex flex-col gap-1.5">
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional) — familiar, escolar, salud..."
          rows={2}
          className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => enviar(false, motivo)}
            className="rounded-md bg-error px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            Confirmar que no puede ir
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setPidiendoMotivo(false)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600"
          >
            Cancelar
          </button>
        </div>
        {error && <div className="text-xs text-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => enviar(true)}
          className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          ✓ Confirmar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setPidiendoMotivo(true)}
          className="rounded-md border border-error px-3 py-1.5 text-xs font-medium text-error disabled:opacity-50"
        >
          ✕ No puede ir
        </button>
      </div>
      {error && <div className="text-xs text-error">{error}</div>}
    </div>
  );
}
