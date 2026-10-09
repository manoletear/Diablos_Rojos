import { createClient } from "@/lib/supabase/server";

export default async function ApoderadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; relacion?: string; porPagina?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const porPagina = Number(sp.porPagina ?? 15);
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * porPagina;

  const supabase = await createClient();

  let query = supabase
    .from("apoderados")
    .select(
      "id, nombre, email, telefono, apoderado_alumno(parentesco, alumnos(nombre, apellido, sedes(nombre)))",
      { count: "exact" }
    )
    .order("nombre")
    .range(offset, offset + porPagina - 1);

  if (sp.q) {
    query = query.or(`nombre.ilike.%${sp.q}%,email.ilike.%${sp.q}%,telefono.ilike.%${sp.q}%`);
  }

  const { data: apoderados, count, error } = await query;

  // El filtro de relacion se aplica en memoria porque depende de la tabla puente
  const apoderadosFiltrados = sp.relacion
    ? (apoderados ?? []).filter((a) =>
        (a.apoderado_alumno as unknown as { parentesco: string | null }[]).some(
          (x) => x.parentesco === sp.relacion
        )
      )
    : apoderados;

  const totalPaginas = Math.max(1, Math.ceil((count ?? 0) / porPagina));

  function hrefCon(params: Record<string, string | undefined>) {
    const usp = new URLSearchParams();
    const merged = { q: sp.q, relacion: sp.relacion, porPagina: String(porPagina), page: String(page), ...params };
    for (const [k, v] of Object.entries(merged)) if (v) usp.set(k, v);
    return `/dashboard/apoderados?${usp.toString()}`;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Apoderados</h1>
          <p className="text-sm text-neutral-500">Gestión de padres y tutores</p>
        </div>
        <button className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + Nuevo Apoderado
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error.message}</div>
      )}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Listado de Apoderados</div>

        <form method="get" className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar por nombre, email o teléfono..."
            className="min-w-[260px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <select name="relacion" defaultValue={sp.relacion ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Tipo de relación</option>
            <option value="principal">Principal</option>
            <option value="padre">Padre</option>
            <option value="parent">Parent</option>
          </select>
          <select name="porPagina" defaultValue={String(porPagina)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="15">15 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
          </select>
          <button type="submit" className="rounded-md bg-dr-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-dr-neutral-800">
            Filtrar
          </button>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-3">Nombre</th>
                <th className="px-3 py-3">Relación</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Teléfono</th>
                <th className="px-3 py-3">Estudiantes</th>
                <th className="px-3 py-3">Sede(s)</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {apoderadosFiltrados && apoderadosFiltrados.length > 0 ? (
                apoderadosFiltrados.map((a) => {
                  const hijos = (a.apoderado_alumno as unknown as {
                    parentesco: string | null;
                    alumnos: { nombre: string; apellido: string; sedes: { nombre: string } | null } | null;
                  }[]) ?? [];
                  const sedes = Array.from(new Set(hijos.map((h) => h.alumnos?.sedes?.nombre).filter(Boolean)));
                  const relacion = hijos.find((h) => h.parentesco)?.parentesco;
                  return (
                    <tr key={a.id}>
                      <td className="px-3 py-3 font-medium text-neutral-900">{a.nombre}</td>
                      <td className="px-3 py-3">
                        {relacion ? (
                          <span className="rounded border border-neutral-300 px-2 py-0.5 text-xs capitalize">{relacion}</span>
                        ) : (
                          <span className="inline-block h-4 w-6 rounded border border-neutral-200" />
                        )}
                      </td>
                      <td className="px-3 py-3 text-neutral-600">{a.email}</td>
                      <td className="px-3 py-3 text-neutral-600">{a.telefono ?? "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {hijos.map((h, i) => (
                            <span key={i} className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                              {h.alumnos?.nombre} {h.alumnos?.apellido}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {sedes.map((s) => (
                          <span key={s} className="rounded border border-info px-2 py-0.5 text-xs text-info">{s}</span>
                        ))}
                      </td>
                      <td className="px-3 py-3 text-neutral-400">⋮</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                    Sin apoderados que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
          <span>
            Mostrando {offset + 1} - {Math.min(offset + porPagina, count ?? 0)} de {count ?? 0} apoderados
          </span>
          <div className="flex items-center gap-2">
            <a href={hrefCon({ page: String(Math.max(1, page - 1)) })} className={`rounded-md border border-neutral-300 px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-neutral-50"}`}>
              Anterior
            </a>
            <span>{page} / {totalPaginas}</span>
            <a href={hrefCon({ page: String(Math.min(totalPaginas, page + 1)) })} className={`rounded-md border border-neutral-300 px-3 py-1.5 ${page >= totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-neutral-50"}`}>
              Siguiente
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
