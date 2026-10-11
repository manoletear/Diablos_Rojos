"use client";

import { useTransition } from "react";
import { confirmarConvocatoria } from "@/app/dashboard/partidos/actions";

export function ConfirmarConvocatoria({ convocatoriaId, alumnoId }: { convocatoriaId: string; alumnoId: string }) {
  const [pending, startTransition] = useTransition();

  function responder(confirma: boolean) {
    startTransition(() => confirmarConvocatoria(convocatoriaId, alumnoId, confirma));
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => responder(true)}
        className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        ✓ Confirmar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => responder(false)}
        className="rounded-md border border-error px-3 py-1.5 text-xs font-medium text-error disabled:opacity-50"
      >
        ✕ No puede ir
      </button>
    </div>
  );
}
