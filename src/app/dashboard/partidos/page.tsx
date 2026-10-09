import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const ESTADO_LABEL: Record<string, string> = {
  programado: "Programado",
  en_curso: "En curso",
  completado: "Completado",
  cancelado: "Cancelado",
};
const ESTADO_STYLE: Record<string, string> = {
  programado: "bg-info-bg text-info",
  en_curso: "bg-warning-bg text-warning",
  completado: "bg-success-bg text-success",
  cancelado: "bg-error-bg text-error",
};

export default async function PartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; estado?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: categorias } = await supabase.from("categorias").select("id, nombre").order("nombre");

  let query = supabase
    .from("partidos")
    .select(
      "id, fecha_hora, rival, local_o_visita, estado, resultado_local, resultado_rival, categorias(nombre), torneos(nombre), recintos(nombre), convocatorias(convocatoria_jugadores(count))"
    )
    .order("fecha_hora", { ascending: false })
    .limit(50);

  if (sp.categoria) query = query.eq("categoria_id", sp.categoria);
  if (sp.estado) query = query.eq("estado", sp.estado);

  const { data: partidos, error } = await query;

  function hrefCon(params: Record<string, string | undefined>) {
    const usp = new URLSearchParams();
    const merged = { categoria: sp.categoria, estado: sp.estado, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) usp.set(k, v);
    return `/dashboard/partidos?${usp.toString()}`;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Partidos</h1>
          <p className="text-sm text-neutral-500">Gestión de partidos y convocatorias</p>
        </div>
        <Link href="/dashboard/partidos/nuevo" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + Nuevo Partido
        </Link>
      </div>

      {error && <div className="mt-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error.message}</div>}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Listado de Partidos</div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={hrefCon({ categoria: undefined })} className={`rounded-full px-3 py-1 text-xs font-medium ${!sp.categoria ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>Todas</a>
          {categorias?.map((c) => (
            <a key={c.id} href={hrefCon({ categoria: c.id })} className={`rounded-full px-3 py-1 text-xs font-medium ${sp.categoria === c.id ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>
              {c.nombre}
            </a>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={hrefCon({ estado: undefined })} className={`rounded-full px-3 py-1 text-xs font-medium ${!sp.estado ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>Todos</a>
          {Object.entries(ESTADO_LABEL).map(([v, label]) => (
            <a key={v} href={hrefCon({ estado: v })} className={`rounded-full px-3 py-1 text-xs font-medium ${sp.estado === v ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>
              {label}
            </a>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Categoría</th>
                <th className="px-3 py-3">Rival</th>
                <th className="px-3 py-3">Torneo</th>
                <th className="px-3 py-3">Ubicación</th>
                <th className="px-3 py-3">Resultado</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Convocados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {partidos && partidos.length > 0 ? (
                partidos.map((p) => {
                  const cat = (p.categorias as unknown as { nombre: string } | null)?.nombre;
                  const torneo = (p.torneos as unknown as { nombre: string } | null)?.nombre;
                  const recinto = (p.recintos as unknown as { nombre: string } | null)?.nombre;
                  const conv = p.convocatorias as unknown as { convocatoria_jugadores: { count: number }[] } | null;
                  const nConvocados = conv?.convocatoria_jugadores?.[0]?.count ?? 0;
                  const fecha = new Date(p.fecha_hora);
                  return (
                    <tr key={p.id}>
                      <td className="px-3 py-3 text-neutral-600">
                        {fecha.toLocaleDateString("es-CL")} {fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-3"><span className="rounded border border-neutral-300 px-2 py-0.5 text-xs">{cat}</span></td>
                      <td className="px-3 py-3 font-medium text-neutral-900">
                        vs {p.rival} <span className="text-xs text-neutral-400">({p.local_o_visita})</span>
                      </td>
                      <td className="px-3 py-3 text-neutral-600">{torneo ?? "—"}</td>
                      <td className="px-3 py-3 text-neutral-600">{recinto ?? "—"}</td>
                      <td className="px-3 py-3 text-neutral-600">
                        {p.resultado_local !== null && p.resultado_rival !== null ? `${p.resultado_local} - ${p.resultado_rival}` : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[p.estado]}`}>{ESTADO_LABEL[p.estado]}</span>
                      </td>
                      <td className="px-3 py-3 text-neutral-600">{nConvocados > 0 ? `${nConvocados} jugadores` : "Sin convocatoria"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-400">
                    Sin partidos todavía. Crea el primero o importa el historial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
