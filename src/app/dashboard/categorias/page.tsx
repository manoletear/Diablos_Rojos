import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function money(n: number | null) {
  if (n === null) return null;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function CategoriasPage() {
  const supabase = await createClient();

  const { data: categorias, error } = await supabase
    .from("categorias")
    .select(
      "id, nombre, anio_desde, anio_hasta, dias_horario, estado, mensualidad_base, sedes(nombre), entrenadores!entrenador_principal_id(nombre), alumnos(count)"
    )
    .order("anio_desde", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Categorías</h1>
          <p className="text-sm text-neutral-500">Gestión de categorías deportivas</p>
        </div>
        <Link href="/dashboard/categorias/nuevo" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + Nueva Categoría
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error.message}</div>
      )}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Listado de Categorías</div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-3">Nombre</th>
                <th className="px-3 py-3">Años de nacimiento</th>
                <th className="px-3 py-3">Entrenador Principal</th>
                <th className="px-3 py-3">Estudiantes</th>
                <th className="px-3 py-3">Horario</th>
                <th className="px-3 py-3">Mensualidad</th>
                <th className="px-3 py-3">Sede</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {categorias?.map((cat) => {
                const sede = (cat.sedes as unknown as { nombre: string } | null)?.nombre;
                const entrenador = (cat.entrenadores as unknown as { nombre: string } | null)?.nombre;
                const alumnosCount = (cat.alumnos as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
                const rango = cat.anio_desde === cat.anio_hasta ? `${cat.anio_desde}` : `${cat.anio_desde} - ${cat.anio_hasta}`;
                const precio = money(cat.mensualidad_base);

                return (
                  <tr key={cat.id}>
                    <td className="px-3 py-3 font-medium text-neutral-900">{cat.nombre}</td>
                    <td className="px-3 py-3 text-neutral-600">{rango}</td>
                    <td className="px-3 py-3">
                      {entrenador ? (
                        <span className="rounded border border-neutral-300 px-2 py-0.5 text-xs">{entrenador}</span>
                      ) : (
                        <span className="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded border border-neutral-300 px-2 py-0.5 text-xs">{alumnosCount} alumnos</span>
                    </td>
                    <td className="px-3 py-3 text-neutral-600">{cat.dias_horario ?? "—"}</td>
                    <td className="px-3 py-3 text-neutral-600">
                      {precio ?? <span className="text-neutral-400">Hereda</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded border border-info px-2 py-0.5 text-xs text-info">{sede ?? "—"}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          cat.estado === "activa" ? "bg-success-bg text-success" : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {cat.estado === "activa" ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/dashboard/categorias/${cat.id}/editar`} className="text-xs font-medium text-primary-600 hover:underline">
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
