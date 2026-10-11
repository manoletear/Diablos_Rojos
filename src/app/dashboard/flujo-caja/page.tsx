import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { conciliarConPago, anularDocumento } from "./actions";

function money(n: number | null) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function primerDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

const ESTADO_STYLE: Record<string, string> = {
  pendiente: "bg-warning-bg text-warning",
  conciliado: "bg-success-bg text-success",
  anulado: "bg-neutral-100 text-neutral-400",
};

export default async function FlujoCajaPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const sp = await searchParams;
  const desde = sp.desde || primerDiaMes();
  const hasta = sp.hasta || hoy();

  const supabase = await createClient();

  const [{ data: resumen }, { data: emitidos }, { data: recibidos }, { data: pagosSinConciliar }] = await Promise.all([
    supabase.rpc("flujo_caja_periodo", { p_desde: desde, p_hasta: hasta }).maybeSingle(),
    supabase
      .from("documentos_tributarios")
      .select("id, tipo, folio, razon_social_contraparte, monto_total, fecha_emision, estado, pago_id")
      .eq("direccion", "emitido")
      .gte("fecha_emision", desde)
      .lte("fecha_emision", hasta)
      .order("fecha_emision", { ascending: false }),
    supabase
      .from("documentos_tributarios")
      .select("id, tipo, folio, razon_social_contraparte, monto_total, fecha_emision, estado, categoria_gasto")
      .eq("direccion", "recibido")
      .gte("fecha_emision", desde)
      .lte("fecha_emision", hasta)
      .order("fecha_emision", { ascending: false }),
    supabase
      .from("pagos")
      .select("id, tipo, periodo, monto_pagado, alumnos(nombre, apellido)")
      .in("estado", ["pagado", "parcial"])
      .order("fecha_registro", { ascending: false })
      .limit(200),
  ]);

  const r = (resumen as {
    cobrado_conciliado: number | null;
    cobrado_sin_conciliar: number | null;
    gastos: number | null;
    flujo_neto: number | null;
  } | null) ?? { cobrado_conciliado: 0, cobrado_sin_conciliar: 0, gastos: 0, flujo_neto: 0 };

  const cards = [
    { label: "Cobrado y conciliado", value: money(Number(r.cobrado_conciliado ?? 0)), tone: "text-success" },
    { label: "Cobrado sin boleta/factura", value: money(Number(r.cobrado_sin_conciliar ?? 0)), tone: "text-warning" },
    { label: "Gastos (compras)", value: money(Number(r.gastos ?? 0)), tone: "text-error" },
    { label: "Flujo neto", value: money(Number(r.flujo_neto ?? 0)), tone: "text-dr-neutral-900" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Flujo de Caja</h1>
          <p className="text-sm text-neutral-500">Boletas/facturas emitidas (cobro) y recibidas (gastos), conciliadas con los pagos</p>
        </div>
        <Link href="/dashboard/flujo-caja/nuevo" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + Registrar documento
        </Link>
      </div>

      <div className="mt-4 rounded-md bg-info-bg px-4 py-3 text-xs text-info">
        Carga manual por ahora — integración automática con banco (Fintoc) y SII pendiente de decidir proveedor. Ver{" "}
        <span className="font-medium">docs/PLAN.md</span>.
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-neutral-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-neutral-600">Desde</label>
          <input type="date" name="desde" defaultValue={desde} className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">Hasta</label>
          <input type="date" name="hasta" defaultValue={hasta} className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-md bg-dr-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-dr-neutral-800">
          Filtrar
        </button>
      </form>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-neutral-500">{c.label}</div>
            <div className={`mt-1 text-xl font-bold ${c.tone}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Emitidas (cobro a apoderados)</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Folio</th>
                <th className="px-3 py-2">Contraparte</th>
                <th className="px-3 py-2">Monto</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Conciliar con pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {emitidos && emitidos.length > 0 ? (
                emitidos.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 text-neutral-600">{d.fecha_emision}</td>
                    <td className="px-3 py-2 capitalize text-neutral-600">{d.tipo}</td>
                    <td className="px-3 py-2 text-neutral-600">{d.folio ?? "—"}</td>
                    <td className="px-3 py-2 text-neutral-600">{d.razon_social_contraparte ?? "—"}</td>
                    <td className="px-3 py-2 font-medium text-neutral-900">{money(Number(d.monto_total))}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[d.estado]}`}>{d.estado}</span>
                    </td>
                    <td className="px-3 py-2">
                      <form action={conciliarConPago.bind(null, d.id)} className="flex items-center gap-1">
                        <select name="pago_id" defaultValue={d.pago_id ?? ""} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
                          <option value="">Sin conciliar</option>
                          {pagosSinConciliar?.map((p) => {
                            const al = p.alumnos as unknown as { nombre: string; apellido: string } | null;
                            return (
                              <option key={p.id} value={p.id}>
                                {al?.nombre} {al?.apellido} · {money(Number(p.monto_pagado))}
                              </option>
                            );
                          })}
                        </select>
                        <button type="submit" className="rounded-md bg-dr-neutral-900 px-2 py-1 text-xs font-medium text-white">
                          Guardar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">Sin documentos emitidos en el periodo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Recibidas (gastos / compras)</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Folio</th>
                <th className="px-3 py-2">Proveedor</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Monto</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recibidos && recibidos.length > 0 ? (
                recibidos.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 text-neutral-600">{d.fecha_emision}</td>
                    <td className="px-3 py-2 capitalize text-neutral-600">{d.tipo}</td>
                    <td className="px-3 py-2 text-neutral-600">{d.folio ?? "—"}</td>
                    <td className="px-3 py-2 text-neutral-600">{d.razon_social_contraparte ?? "—"}</td>
                    <td className="px-3 py-2 text-neutral-600">{d.categoria_gasto ?? "—"}</td>
                    <td className="px-3 py-2 font-medium text-neutral-900">{money(Number(d.monto_total))}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[d.estado]}`}>{d.estado}</span>
                    </td>
                    <td className="px-3 py-2">
                      {d.estado !== "anulado" && (
                        <form action={anularDocumento.bind(null, d.id)}>
                          <button type="submit" className="text-xs font-medium text-error hover:underline">Anular</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">Sin documentos recibidos en el periodo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
