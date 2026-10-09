import { createClient } from "@/lib/supabase/server";

export default async function AlumnosPage() {
  const supabase = await createClient();

  const { data: alumnos, error } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido, estado, posicion, numero_camiseta, categorias(nombre)")
    .order("apellido");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Alumnos</h1>
          <p className="text-sm text-neutral-500">
            Gestión de estudiantes de la academia
          </p>
        </div>
        <button className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
          + Nuevo Alumno
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
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
                          ? "bg-green-50 text-green-700"
                          : a.estado === "en_prueba"
                            ? "bg-amber-50 text-amber-700"
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
                  Sin alumnos todavía. Crea el primero o importa el CSV.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
