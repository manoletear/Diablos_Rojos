import { createClient } from "@/lib/supabase/server";
import { guardarAsistencia } from "./actions";

export default async function AsistenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; fecha?: string }>;
}) {
  const { categoria, fecha } = await searchParams;
  const hoy = new Date().toISOString().slice(0, 10);
  const fechaSel = fecha ?? hoy;

  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre")
    .eq("estado", "activa")
    .order("nombre");

  let alumnos: { id: string; nombre: string; apellido: string }[] = [];
  let registrosPrevios: Record<string, string> = {};

  if (categoria) {
    const { data } = await supabase
      .from("alumnos")
      .select("id, nombre, apellido")
      .eq("categoria_id", categoria)
      .eq("estado", "matriculado")
      .order("apellido");
    alumnos = data ?? [];

    const { data: sesion } = await supabase
      .from("sesiones_entrenamiento")
      .select("id, registros_asistencia(alumno_id, estado)")
      .eq("categoria_id", categoria)
      .eq("fecha", fechaSel)
      .maybeSingle();

    if (sesion) {
      const regs = sesion.registros_asistencia as unknown as
        | { alumno_id: string; estado: string }[]
        | null;
      registrosPrevios = Object.fromEntries(
        (regs ?? []).map((r) => [r.alumno_id, r.estado])
      );
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Asistencias</h1>
      <p className="text-sm text-neutral-500">
        Registro de asistencia de entrenamientos
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Categoría
          </label>
          <select
            name="categoria"
            defaultValue={categoria ?? ""}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Seleccionar</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Fecha
          </label>
          <input
            type="date"
            name="fecha"
            defaultValue={fechaSel}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900"
        >
          Cargar
        </button>
      </form>

      {!categoria && (
        <p className="mt-8 text-sm text-neutral-400">
          Selecciona una categoría para comenzar
        </p>
      )}

      {categoria && alumnos.length > 0 && (
        <form action={guardarAsistencia} className="mt-6">
          <input type="hidden" name="categoria_id" value={categoria} />
          <input type="hidden" name="fecha" value={fechaSel} />

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {alumnos.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <input type="hidden" name="alumno_id" value={a.id} />
                      {a.nombre} {a.apellido}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        name={`estado_${a.id}`}
                        defaultValue={registrosPrevios[a.id] ?? "presente"}
                        className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
                      >
                        <option value="presente">Presente</option>
                        <option value="ausente">Ausente</option>
                        <option value="tardanza">Tardanza</option>
                        <option value="justificada">Justificada</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Guardar Asistencia
          </button>
        </form>
      )}
    </div>
  );
}
