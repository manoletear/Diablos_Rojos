import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarAbono } from "../actions";

function money(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export default async function DetallePagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: pago }, { data: abonos }] = await Promise.all([
    supabase.from("pagos").select("*, alumnos(nombre, apellido)").eq("id", id).single(),
    supabase.from("pagos_transacciones").select("*").eq("pago_id", id).order("created_at", { ascending: false }),
  ]);

  if (!pago) notFound();
  const alumno = pago.alumnos as unknown as { nombre: string; apellido: string } | null;
  const registrarConId = registrarAbono.bind(null, id);
  const saldo = Number(pago.monto_total) - Number(pago.monto_pagado);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Pago — {alumno?.nombre} {alumno?.apellido}</h1>
      <p className="text-sm text-neutral-500">{pago.tipo === "matricula" ? "Matrícula" : pago.periodo ?? pago.tipo}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">Total</div>
          <div className="text-xl font-bold text-neutral-900">{money(Number(pago.monto_total))}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">Pagado</div>
          <div className="text-xl font-bold text-success">{money(Number(pago.monto_pagado))}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">Saldo</div>
          <div className="text-xl font-bold text-error">{money(saldo)}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="font-semibold text-neutral-900">Abonos registrados</div>
        <div className="mt-3 space-y-2">
          {abonos && abonos.length > 0 ? (
            abonos.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm">
                <span>{money(Number(a.monto))} · {a.metodo_pago ?? "—"}</span>
                <span className="text-xs text-neutral-400">{new Date(a.created_at).toLocaleDateString("es-CL")}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-400">Sin abonos registrados todavía.</div>
          )}
        </div>

        {saldo > 0 && (
          <form action={registrarConId} className="mt-4 flex items-end gap-2 border-t border-neutral-200 pt-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-600">Monto del abono</label>
              <input type="number" name="monto" required max={saldo} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <select name="metodo_pago" className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="mercadopago">MercadoPago</option>
              <option value="pos">POS</option>
            </select>
            <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
              Registrar Abono
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
