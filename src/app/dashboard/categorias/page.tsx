import { createClient } from "@/lib/supabase/server";

export default async function CategoriasPage() {
  const supabase = await createClient();

  const { data: categorias, error } = await supabase
    .from("categorias")
    .select("id, nombre, anio_desde, anio_hasta, dias_horario, estado, sedes(nombre), alumnos(count)")
    .order("anio_desde", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Categorías</h1>
          <p className="text-sm text-neutral-500">
            Gestión de categorías deportivas
          </p>
        </div>
        <button className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + Nueva Categoría
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-600">
          {error.message}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categorias?.map((cat) => {
          const sede = (cat.sedes as unknown as { nombre: string } | null)?.nombre;
          const alumnosCount =
            (cat.alumnos as unknown as { count: number }[] | null)?.[0]
              ?.count ?? 0;
          const rango =
            cat.anio_desde === cat.anio_hasta
              ? cat.anio_desde
              : `${cat.anio_desde}-${cat.anio_hasta}`;

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-neutral-900">{cat.nombre}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    cat.estado === "activa"
                      ? "bg-green-50 text-green-700"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {cat.estado}
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-400">{rango}</div>
              <div className="mt-3 text-sm text-neutral-600">
                {alumnosCount} alumnos
              </div>
              <div className="mt-1 text-sm text-neutral-600">{sede}</div>
              {cat.dias_horario && (
                <div className="mt-1 text-xs text-neutral-400">
                  {cat.dias_horario}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
