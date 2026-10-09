import { createClient } from "@/lib/supabase/server";

function money(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

const ESTADO_STYLE: Record<string, string> = {
  pendiente: "bg-warning-bg text-warning",
  parcial: "bg-info-bg text-info",
  por_comprobar: "bg-purple-50 text-purple-700",
  pagado: "bg-success-bg text-success",
  vencido: "bg-error-bg text-error",
};

export default async function FinanzasPage() {
  const supabase = await createClient();

  const { data: pagos, error } = await supabase
    .from("pagos")
    .select("id, tipo, periodo, monto_total, monto_pagado, estado, fecha_vencimiento, fecha_registro, alumnos(nombre, apellido)")
    .order("fecha_registro", { ascending: false })
    .limit(50);

  const { data: resumenRaw } = await supabase
    .from("pagos")
    .select("estado, monto_total, monto_pagado");

  const resumen = (resumenRaw ?? []).reduce(
    (acc, p) => {
      acc[p.estado] = (acc[p.estado] ?? 0) + 1;
      acc.totalGenerado += Number(p.monto_total);
      acc.totalRecaudado += Number(p.monto_pagado);
      return acc;
    },
    {
      pendiente: 0,
      parcial: 0,
      por_comprobar: 0,
      pagado: 0,
      vencido: 0,
      totalGenerado: 0,
      totalRecaudado: 0,
    } as Record<string, number>
  );

  const cards = [
    { label: "Total Generado", value: money(resumen.totalGenerado) },
    { label: "Total Recaudado", value: money(resumen.totalRecaudado) },
    {
      label: "Balance Pendiente",
      value: money(resumen.totalGenerado - resumen.totalRecaudado),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Finanzas</h1>
          <p className="text-sm text-neutral-500">Gestión de cuotas y pagos</p>
        </div>
        <button className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + Nuevo Pago
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-600">
          {error.message}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="text-sm text-neutral-500">{c.label}</div>
            <div className="mt-1 text-2xl font-bold text-neutral-900">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["pendiente", "parcial", "por_comprobar", "pagado", "vencido"] as const).map(
          (estado) => (
            <span
              key={estado}
              className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_STYLE[estado]}`}
            >
              {estado}: {resumen[estado]}
            </span>
          )
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Alumno</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pagado</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Vencimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pagos?.map((p) => {
              const alumno = p.alumnos as unknown as {
                nombre: string;
                apellido: string;
              } | null;
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {alumno?.nombre} {alumno?.apellido}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {p.tipo === "matricula" ? "Matrícula de temporada" : `Mensualidad ${p.periodo}`}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {money(Number(p.monto_total))}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {money(Number(p.monto_pagado))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[p.estado]}`}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {p.fecha_vencimiento}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
