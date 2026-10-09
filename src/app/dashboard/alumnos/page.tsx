import { createClient } from "@/lib/supabase/server";

const ESTADOS = [
  { value: "matriculado", label: "Matriculado" },
  { value: "en_prueba", label: "En Prueba" },
  { value: "retirado", label: "Retirado" },
];

export default async function AlumnosPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoria?: string;
    posicion?: string;
    numero?: string;
    estado?: string;
  }>;
}) {
  const { categoria, posicion, numero, estado } = await searchParams;

  const supabase = await createClient();

  const [{ data: categorias }, { data: posicionesRaw }] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase
      .from("alumnos")
      .select("posicion")
      .not("posicion", "is", null)
      .order("posicion"),
  ]);

  const posiciones = Array.from(
    new Set((posicionesRaw ?? []).map((p) => p.posicion).filter(Boolean))
  ) as string[];

  let query = supabase
    .from("alumnos")
    .select("id, nombre, apellido, estado, posicion, numero_camiseta, categorias(nombre)")
    .order("apellido");

  if (categoria) query = query.eq("categoria_id", categoria);
  if (posicion) query = query.eq("posicion", posicion);
  if (numero) query = query.eq("numero_camiseta", Number(numero));
  if (estado) query = query.eq("estado", estado);

  const { data: alumnos, error } = await query;

  const hayFiltros = categoria || posicion || numero || estado;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Alumnos</h1>
          <p className="text-sm text-neutral-500">
            Gestión de estudiantes de la academia
          </p>
        </div>
        <button className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + Nuevo Alumno
        </button>
      </div>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4"
      >
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Categoría
          </label>
          <select
            name="categoria"
            defaultValue={categoria ?? ""}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Posición
          </label>
          <select
            name="posicion"
            defaultValue={posicion ?? ""}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {posiciones.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Número
          </label>
          <input
            type="number"
            name="numero"
            defaultValue={numero ?? ""}
            placeholder="Ej. 10"
            className="mt-1 w-24 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Estado
          </label>
          <select
            name="estado"
            defaultValue={estado ?? ""}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-dr-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-dr-neutral-800"
        >
          Filtrar
        </button>
        {hayFiltros && (
          <a
            href="/dashboard/alumnos"
            className="text-sm text-neutral-500 underline hover:text-neutral-700"
          >
            Limpiar filtros
          </a>
        )}
      </form>

      {error && (
        <div className="mt-4 rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-600">
          {error.message}
        </div>
      )}

      <div className="mt-4 text-xs text-neutral-400">
        {alumnos?.length ?? 0} alumno{alumnos?.length === 1 ? "" : "s"}
      </div>

      <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Posición</th>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {alumnos && alumnos.length > 0 ? (
              alumnos.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {a.nombre} {a.apellido}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {(a.categorias as unknown as { nombre: string } | null)
                      ?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {a.posicion ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {a.numero_camiseta ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.estado === "matriculado"
                          ? "bg-success-bg text-success"
                          : a.estado === "en_prueba"
                            ? "bg-warning-bg text-warning"
                            : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {a.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  {hayFiltros
                    ? "Sin alumnos que coincidan con los filtros."
                    : "Sin alumnos todavía. Crea el primero o importa el CSV."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
