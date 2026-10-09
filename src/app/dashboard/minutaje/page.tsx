import { createClient } from "@/lib/supabase/server";

export default async function MinutajePage() {
  const supabase = await createClient();

  const { data: categoriasResumen } = await supabase
    .from("minutaje_categoria_resumen")
    .select("categoria_id, temporada, alumnos, jornadas, partidos, minutos_totales, citados_promedio_jornada, categorias(nombre)")
    .order("categorias(nombre)");

  const { data: alumnosResumen } = await supabase
    .from("minutaje_resumen")
    .select(
      "categoria_id, estado, asistencia_pct, entrenamientos_presente, entrenamientos_registrados, convocatoria_pct, convocado_jornadas, jornadas_categoria, partidos_con_minutos, partidos_categoria, partidos_sin_entrar, minutaje_efectivo_pct, minutos_cat_propia, minutos_otras_cat, minutos_totales, minutos_ult5_jornadas, jornadas_ult5, alumnos(nombre, apellido)"
    )
    .order("minutos_totales", { ascending: false });

  const porCategoria = new Map<string, typeof alumnosResumen>();
  for (const a of alumnosResumen ?? []) {
    const key = a.categoria_id ?? "sin-categoria";
    if (!porCategoria.has(key)) porCategoria.set(key, []);
    porCategoria.get(key)!.push(a);
  }

  return (
    <div className="p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">📊 Distribución de minutos</h1>
      <p className="text-sm text-neutral-500">Minutos jugados por alumno dentro de su categoría, para apoyar decisiones de convocatoria.</p>

      <div className="mt-6 space-y-6">
        {categoriasResumen?.map((cat) => {
          const nombre = (cat.categorias as unknown as { nombre: string } | null)?.nombre ?? "—";
          const alumnos = porCategoria.get(cat.categoria_id) ?? [];

          return (
            <div key={cat.categoria_id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="font-semibold text-neutral-900">{nombre}</div>
              <div className="mt-1 flex flex-wrap gap-4 text-xs text-neutral-500">
                <span>{cat.alumnos} alumnos</span>
                <span>{cat.jornadas} jornadas</span>
                <span>{cat.partidos} partidos</span>
                <span>{cat.minutos_totales} min repartidos</span>
                <span>{cat.citados_promedio_jornada} citados/jornada</span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="px-2 py-2">Alumno</th>
                      <th className="px-2 py-2">Asistencia</th>
                      <th className="px-2 py-2">Convocado</th>
                      <th className="px-2 py-2">Entró</th>
                      <th className="px-2 py-2">Sin entrar</th>
                      <th className="px-2 py-2">Min. efectivo</th>
                      <th className="px-2 py-2">Minutos</th>
                      <th className="px-2 py-2">Últimas 5 jornadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {alumnos.map((a, i) => {
                      const al = a.alumnos as unknown as { nombre: string; apellido: string } | null;
                      return (
                        <tr key={i}>
                          <td className="px-2 py-2 font-medium text-neutral-900">
                            {al?.nombre} {al?.apellido}
                            {a.estado === "trial" && (
                              <span className="ml-2 rounded bg-warning-bg px-1.5 py-0.5 text-xs text-warning">En prueba</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-neutral-600">
                            {a.asistencia_pct}%
                            <div className="text-xs text-neutral-400">{a.entrenamientos_presente} de {a.entrenamientos_registrados}</div>
                          </td>
                          <td className="px-2 py-2 text-neutral-600">
                            {a.convocatoria_pct}%
                            <div className="text-xs text-neutral-400">{a.convocado_jornadas} de {a.jornadas_categoria}</div>
                          </td>
                          <td className="px-2 py-2 text-neutral-600">{a.partidos_con_minutos} de {a.partidos_categoria}</td>
                          <td className="px-2 py-2 text-neutral-600">{a.partidos_sin_entrar}</td>
                          <td className="px-2 py-2">
                            {a.minutaje_efectivo_pct !== null ? (
                              <span className={a.minutaje_efectivo_pct < 50 ? "text-warning" : "text-neutral-600"}>{a.minutaje_efectivo_pct}%</span>
                            ) : "—"}
                          </td>
                          <td className="px-2 py-2 text-neutral-600">
                            {a.minutos_totales}
                            <div className="text-xs text-neutral-400">{a.minutos_cat_propia} propia + {a.minutos_otras_cat} otras</div>
                          </td>
                          <td className="px-2 py-2 text-neutral-600">{a.minutos_ult5_jornadas} en {a.jornadas_ult5} jornadas</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {(!categoriasResumen || categoriasResumen.length === 0) && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-400">
            Sin datos de minutaje importados todavía.
          </div>
        )}
      </div>
    </div>
  );
}
