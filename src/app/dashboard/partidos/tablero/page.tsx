import { createClient } from "@/lib/supabase/server";

export default async function TableroPartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const sp = await searchParams;
  const rango = Number(sp.rango ?? 7);
  const ahora = new Date();

  const supabase = await createClient();

  const [{ data: requierenCierre }, { data: enVivo }, { data: recientes }] = await Promise.all([
    supabase
      .from("partidos")
      .select("id, fecha_hora, rival, categorias(nombre), torneos(nombre)")
      .in("estado", ["programado", "en_curso"])
      .lt("fecha_hora", ahora.toISOString())
      .order("fecha_hora", { ascending: false }),
    supabase
      .from("partidos")
      .select("id, fecha_hora, rival, resultado_local, resultado_rival, categorias(nombre)")
      .eq("estado", "en_curso"),
    supabase
      .from("partidos")
      .select("id, fecha_hora, rival, resultado_local, resultado_rival, categorias(nombre), torneos(nombre)")
      .eq("estado", "completado")
      .gte("fecha_hora", new Date(ahora.getTime() - rango * 86400000).toISOString())
      .order("fecha_hora", { ascending: false }),
  ]);

  function hrefCon(r: number) {
    return `/dashboard/partidos/tablero?rango=${r}`;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Tablero de Partidos</h1>
      <p className="text-sm text-neutral-500">Monitorea partidos en vivo y revisa los resultados recientes de la academia.</p>

      {requierenCierre && requierenCierre.length > 0 && (
        <div className="mt-6 rounded-xl border border-warning bg-warning-bg p-5">
          <div className="font-semibold text-neutral-900">⚠️ Requieren cierre ({requierenCierre.length})</div>
          <div className="mt-1 text-sm text-neutral-600">
            Partidos con fecha pasada que siguen en estado Programado o En curso. Registra el resultado o cancélalos.
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {requierenCierre.slice(0, 12).map((p) => {
              const cat = (p.categorias as unknown as { nombre: string } | null)?.nombre;
              const fecha = new Date(p.fecha_hora);
              return (
                <div key={p.id} className="rounded-lg border border-warning bg-white px-3 py-2 text-xs">
                  <div className="font-medium text-neutral-900">{cat} · vs {p.rival}</div>
                  <div className="mt-0.5 text-neutral-500">
                    {fecha.toLocaleDateString("es-CL")} {fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-neutral-900">🔴 En vivo ahora</div>
        </div>
        <div className="mt-3">
          {enVivo && enVivo.length > 0 ? (
            <div className="space-y-2">
              {enVivo.map((p) => {
                const cat = (p.categorias as unknown as { nombre: string } | null)?.nombre;
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-error-bg px-4 py-3 text-sm">
                    <span className="font-medium text-neutral-900">{cat} · vs {p.rival}</span>
                    <span className="font-bold text-error">
                      {p.resultado_local ?? 0} - {p.resultado_rival ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
              No hay partidos en curso en este momento.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-neutral-900">🏆 Resultados recientes</div>
          <div className="flex gap-1">
            {[2, 7, 14, 30].map((r) => (
              <a
                key={r}
                href={hrefCon(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${rango === r ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600"}`}
              >
                Últimos {r} días
              </a>
            ))}
          </div>
        </div>
        <div className="mt-3">
          {recientes && recientes.length > 0 ? (
            <div className="space-y-2">
              {recientes.map((p) => {
                const cat = (p.categorias as unknown as { nombre: string } | null)?.nombre;
                const torneo = (p.torneos as unknown as { nombre: string } | null)?.nombre;
                const fecha = new Date(p.fecha_hora);
                const ganado = (p.resultado_local ?? 0) > (p.resultado_rival ?? 0);
                const empate = p.resultado_local === p.resultado_rival;
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium text-neutral-900">{cat} · vs {p.rival}</span>
                      <span className="ml-2 text-xs text-neutral-400">{torneo} · {fecha.toLocaleDateString("es-CL")}</span>
                    </div>
                    <span className={`font-bold ${ganado ? "text-success" : empate ? "text-neutral-500" : "text-error"}`}>
                      {p.resultado_local} - {p.resultado_rival}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
              No hay partidos completados en los últimos {rango} días.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
