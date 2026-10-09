import { createClient } from "@/lib/supabase/server";

export default async function ApoderadosPage() {
  const supabase = await createClient();

  const { data: apoderados, error } = await supabase
    .from("apoderados")
    .select(
      "id, nombre, email, telefono, apoderado_alumno(parentesco, es_principal, alumnos(nombre, apellido))"
    )
    .order("nombre");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Apoderados</h1>
          <p className="text-sm text-neutral-500">
            Gestión de padres y tutores
          </p>
        </div>
        <button className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
          + Nuevo Apoderado
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Alumno(s)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {apoderados && apoderados.length > 0 ? (
              apoderados.map((a) => {
                const hijos = (
                  a.apoderado_alumno as unknown as {
                    parentesco: string | null;
                    es_principal: boolean;
                    alumnos: { nombre: string; apellido: string } | null;
                  }[]
                ) ?? [];
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {a.nombre}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{a.email}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {a.telefono ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {hijos.length > 0
                        ? hijos
                            .map(
                              (h) =>
                                `${h.alumnos?.nombre ?? ""} ${h.alumnos?.apellido ?? ""}`.trim()
                            )
                            .join(", ")
                        : "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  Sin apoderados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
