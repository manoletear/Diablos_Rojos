import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

const ESTADOS = [
  { value: "matriculado", label: "Matriculado" },
  { value: "en_prueba", label: "En Prueba" },
];

function edad(fechaNacimiento: string | null) {
  if (!fechaNacimiento) return null;
  const fn = new Date(fechaNacimiento);
  const hoy = new Date();
  let e = hoy.getFullYear() - fn.getFullYear();
  const m = hoy.getMonth() - fn.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) e--;
  return e;
}

export default async function AlumnosPage({
  searchParams,
}: {
  searchParams: Promise<{
    vista?: string;
    categoria?: string;
    posicion?: string;
    estado?: string;
    camiseta?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const vista = sp.vista === "retirados" ? "retirados" : "activos";
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  const [{ count: countActivos }, { count: countRetirados }, { data: categorias }, { data: posicionesRaw }] =
    await Promise.all([
      supabase.from("alumnos").select("*", { count: "exact", head: true }).in("estado", ["matriculado", "en_prueba"]),
      supabase.from("alumnos").select("*", { count: "exact", head: true }).eq("estado", "retirado"),
      supabase.from("categorias").select("id, nombre").order("nombre"),
      supabase.from("alumnos").select("posicion").not("posicion", "is", null),
    ]);

  const posiciones = Array.from(new Set((posicionesRaw ?? []).map((p) => p.posicion).filter(Boolean))) as string[];

  let query = supabase
    .from("alumnos")
    .select(
      "id, nombre, apellido, fecha_nacimiento, estado, posicion, numero_camiseta, categorias(nombre), apoderado_alumno(apoderados(telefono))",
      { count: "exact" }
    )
    .order("apellido")
    .range(offset, offset + PAGE_SIZE - 1);

  query = vista === "retirados" ? query.eq("estado", "retirado") : query.in("estado", ["matriculado", "en_prueba"]);
  if (sp.categoria) query = query.eq("categoria_id", sp.categoria);
  if (sp.posicion) query = query.eq("posicion", sp.posicion);
  if (sp.estado) query = query.eq("estado", sp.estado);
  if (sp.camiseta === "con") query = query.not("numero_camiseta", "is", null);
  if (sp.camiseta === "sin") query = query.is("numero_camiseta", null);
  if (sp.q) query = query.or(`nombre.ilike.%${sp.q}%,apellido.ilike.%${sp.q}%`);

  const { data: alumnos, count, error } = await query;

  // Asistencia real (presentes / total) para los alumnos visibles en esta pagina
  const ids = (alumnos ?? []).map((a) => a.id);
  const asistenciaPorAlumno: Record<string, { presentes: number; total: number }> = {};
  if (ids.length > 0) {
    const { data: registros } = await supabase
      .from("registros_asistencia")
      .select("alumno_id, estado")
      .in("alumno_id", ids);
    for (const r of registros ?? []) {
      const acc = (asistenciaPorAlumno[r.alumno_id] ??= { presentes: 0, total: 0 });
      acc.total++;
      if (r.estado === "presente") acc.presentes++;
    }
  }

  const totalPaginas = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function hrefCon(params: Record<string, string | undefined>) {
    const usp = new URLSearchParams();
    const merged = { vista, categoria: sp.categoria, posicion: sp.posicion, estado: sp.estado, camiseta: sp.camiseta, q: sp.q, page: String(page), ...params };
    for (const [k, v] of Object.entries(merged)) {
      if (v) usp.set(k, v);
    }
    return `/dashboard/alumnos?${usp.toString()}`;
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Alumnos</h1>
          <p className="text-sm text-neutral-500">Gestión de estudiantes de la academia</p>
        </div>
        <div className="flex gap-2">
          <button
            disabled
            title="Pendiente de implementar"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-400"
          >
            ⬇ Exportar CSV
          </button>
          <button
            disabled
            title="Pendiente de implementar"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-400"
          >
            Invitados
          </button>
          <button className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
            + Nuevo Alumno
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Listado de Alumnos</div>

        {/* Toggle Activos / Retirados */}
        <div className="mt-4 flex overflow-hidden rounded-lg border border-neutral-200 text-sm">
          <a
            href={hrefCon({ vista: "activos", page: "1" })}
            className={`flex-1 px-4 py-2 text-center font-medium ${
              vista === "activos" ? "bg-success-bg text-success" : "bg-neutral-50 text-neutral-500"
            }`}
          >
            ✅ Activos ({countActivos ?? 0})
          </a>
          <a
            href={hrefCon({ vista: "retirados", page: "1" })}
            className={`flex-1 px-4 py-2 text-center font-medium ${
              vista === "retirados" ? "bg-primary-50 text-primary-600" : "bg-neutral-50 text-neutral-500"
            }`}
          >
            🚪 Retirados ({countRetirados ?? 0})
          </a>
        </div>

        {/* Busqueda + filtros */}
        <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="vista" value={vista} />
          <input
            type="text"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar por nombre..."
            className="min-w-[220px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <select name="categoria" defaultValue={sp.categoria ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Todas las categorías</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select name="estado" defaultValue={sp.estado ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <select name="camiseta" defaultValue={sp.camiseta ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Todos (camiseta)</option>
            <option value="con">Con número</option>
            <option value="sin">Sin asignar</option>
          </select>
          <select name="posicion" defaultValue={sp.posicion ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Todas (posición)</option>
            {posiciones.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-dr-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-dr-neutral-800">
            Filtrar
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error.message}</div>
        )}

        {/* Tabla */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-3">Foto</th>
                <th className="px-3 py-3">Nombre</th>
                <th className="px-3 py-3">Edad</th>
                <th className="px-3 py-3">Número</th>
                <th className="px-3 py-3">Categoría</th>
                <th className="px-3 py-3">Posición</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Asistencias</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {alumnos && alumnos.length > 0 ? (
                alumnos.map((a) => {
                  const cat = (a.categorias as unknown as { nombre: string } | null)?.nombre;
                  const ap = (a.apoderado_alumno as unknown as { apoderados: { telefono: string | null } | null }[]) ?? [];
                  const telefono = ap.find((x) => x.apoderados?.telefono)?.apoderados?.telefono;
                  const asist = asistenciaPorAlumno[a.id];
                  const e = edad(a.fecha_nacimiento);
                  return (
                    <tr key={a.id}>
                      <td className="px-3 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">
                          {a.nombre[0]}{a.apellido[0]}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-neutral-900">
                        <div className="flex items-center gap-1.5">
                          {a.nombre} {a.apellido}
                          {telefono && (
                            <a
                              href={`https://wa.me/${telefono.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-success"
                              title="Contactar apoderado por WhatsApp"
                            >
                              ●
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-neutral-600">{e !== null ? `${e} años` : "—"}</td>
                      <td className="px-3 py-3">
                        {a.numero_camiseta ? (
                          <span className="rounded border border-neutral-300 px-2 py-0.5 text-xs font-semibold">#{a.numero_camiseta}</span>
                        ) : (
                          <span className="text-xs text-warning">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded border border-neutral-300 px-2 py-0.5 text-xs">{cat ?? "—"}</span>
                      </td>
                      <td className="px-3 py-3">
                        {a.posicion ? (
                          <span className="rounded border border-info px-2 py-0.5 text-xs text-info">{a.posicion}</span>
                        ) : (
                          <span className="text-xs text-neutral-400">Sin posición</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.estado === "matriculado"
                              ? "bg-success-bg text-success"
                              : a.estado === "en_prueba"
                                ? "bg-warning-bg text-warning"
                                : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {a.estado === "matriculado" ? "✅ Matriculado" : a.estado === "en_prueba" ? "🎓 En Prueba" : "Retirado"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-neutral-600">
                        {asist ? `${asist.presentes} / ${asist.total}` : "0 / 0"}
                      </td>
                      <td className="px-3 py-3 text-neutral-400">⋮</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-400">
                    Sin alumnos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacion */}
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
          <span>
            Mostrando {alumnos?.length ?? 0} de {count ?? 0} alumnos
          </span>
          <div className="flex items-center gap-2">
            <a
              href={hrefCon({ page: String(Math.max(1, page - 1)) })}
              className={`rounded-md border border-neutral-300 px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-neutral-50"}`}
            >
              Anterior
            </a>
            <span>Página {page} de {totalPaginas}</span>
            <a
              href={hrefCon({ page: String(Math.min(totalPaginas, page + 1)) })}
              className={`rounded-md border border-neutral-300 px-3 py-1.5 ${page >= totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-neutral-50"}`}
            >
              Siguiente
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
