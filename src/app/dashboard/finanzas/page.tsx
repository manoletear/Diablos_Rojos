import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

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

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    periodo?: string;
    tipo?: string;
    estado?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  const [{ data: categorias }, { data: periodosRaw }] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("pagos").select("periodo").not("periodo", "is", null),
  ]);
  const periodos = Array.from(new Set((periodosRaw ?? []).map((p) => p.periodo).filter(Boolean))) as string[];

  let alumnoIdsPorCategoria: string[] | null = null;
  if (sp.categoria) {
    const { data } = await supabase.from("alumnos").select("id").eq("categoria_id", sp.categoria);
    alumnoIdsPorCategoria = (data ?? []).map((a) => a.id);
  }

  let query = supabase
    .from("pagos")
    .select("id, tipo, periodo, monto_total, monto_pagado, estado, fecha_vencimiento, fecha_registro, alumnos(nombre, apellido)", { count: "exact" })
    .order("fecha_registro", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (sp.periodo) query = query.eq("periodo", sp.periodo);
  if (sp.tipo) query = query.eq("tipo", sp.tipo);
  if (sp.estado) query = query.eq("estado", sp.estado);
  if (alumnoIdsPorCategoria) query = query.in("alumno_id", alumnoIdsPorCategoria.length > 0 ? alumnoIdsPorCategoria : ["00000000-0000-0000-0000-000000000000"]);

  const { data: pagosRaw, count, error } = await query;

  const pagos = sp.q
    ? (pagosRaw ?? []).filter((p) => {
        const al = p.alumnos as unknown as { nombre: string; apellido: string } | null;
        return `${al?.nombre} ${al?.apellido}`.toLowerCase().includes(sp.q!.toLowerCase());
      })
    : pagosRaw;

  const { data: resumenRaw } = await supabase.from("pagos").select("estado, monto_total, monto_pagado");

  const resumen = (resumenRaw ?? []).reduce(
    (acc, p) => {
      acc[p.estado] = (acc[p.estado] ?? 0) + 1;
      acc.totalGenerado += Number(p.monto_total);
      acc.totalRecaudado += Number(p.monto_pagado);
      return acc;
    },
    { pendiente: 0, parcial: 0, por_comprobar: 0, pagado: 0, vencido: 0, totalGenerado: 0, totalRecaudado: 0 } as Record<string, number>
  );

  const cards = [
    { label: "Total Generado", value: money(resumen.totalGenerado) },
    { label: "Total Recaudado", value: money(resumen.totalRecaudado) },
    { label: "Balance Pendiente", value: money(resumen.totalGenerado - resumen.totalRecaudado) },
  ];

  const totalPaginas = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function hrefCon(params: Record<string, string | undefined>) {
    const usp = new URLSearchParams();
    const merged = { q: sp.q, categoria: sp.categoria, periodo: sp.periodo, tipo: sp.tipo, estado: sp.estado, page: String(page), ...params };
    for (const [k, v] of Object.entries(merged)) if (v) usp.set(k, v);
    return `/dashboard/finanzas?${usp.toString()}`;
  }

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

      {error && <div className="mt-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error.message}</div>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-neutral-500">{c.label}</div>
            <div className="mt-1 text-2xl font-bold text-neutral-900">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["pendiente", "parcial", "por_comprobar", "pagado", "vencido"] as const).map((estado) => (
          <span key={estado} className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_STYLE[estado]}`}>
            {estado}: {resumen[estado]}
          </span>
        ))}
      </div>

      <form method="get" className="mt-6 flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white p-4">
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por estudiante..."
          className="min-w-[220px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <select name="categoria" defaultValue={sp.categoria ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="">Categorías</option>
          {categorias?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select name="periodo" defaultValue={sp.periodo ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="">Todos los meses</option>
          {periodos.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="estado" defaultValue={sp.estado ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="">Todos los pagos</option>
          {Object.keys(ESTADO_STYLE).map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select name="tipo" defaultValue={sp.tipo ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="">Todos los tipos</option>
          <option value="matricula">Matrícula</option>
          <option value="mensualidad">Mensualidad</option>
        </select>
        <button type="submit" className="rounded-md bg-dr-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-dr-neutral-800">
          Filtrar
        </button>
        <a href="/dashboard/finanzas" className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50">
          Exportar CSV
        </a>
      </form>

      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white">
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
            {pagos && pagos.length > 0 ? (
              pagos.map((p) => {
                const alumno = p.alumnos as unknown as { nombre: string; apellido: string } | null;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{alumno?.nombre} {alumno?.apellido}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p.tipo === "matricula" ? "Matrícula de temporada" : `Mensualidad ${p.periodo}`}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{money(Number(p.monto_total))}</td>
                    <td className="px-4 py-3 text-neutral-600">{money(Number(p.monto_pagado))}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[p.estado]}`}>{p.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{p.fecha_vencimiento}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Sin pagos que coincidan con los filtros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
        <span>Mostrando {pagos?.length ?? 0} de {count ?? 0} pagos</span>
        <div className="flex items-center gap-2">
          <a href={hrefCon({ page: String(Math.max(1, page - 1)) })} className={`rounded-md border border-neutral-300 px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-neutral-50"}`}>Anterior</a>
          <span>Página {page} de {totalPaginas}</span>
          <a href={hrefCon({ page: String(Math.min(totalPaginas, page + 1)) })} className={`rounded-md border border-neutral-300 px-3 py-1.5 ${page >= totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-neutral-50"}`}>Siguiente</a>
        </div>
      </div>
    </div>
  );
}
