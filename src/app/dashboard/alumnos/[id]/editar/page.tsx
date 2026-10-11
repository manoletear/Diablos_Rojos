import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarAlumno, crearMedicion } from "../../actions";
import { AlumnoFormFields } from "@/components/alumno-form";

export default async function EditarAlumnoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: alumno }, { data: categorias }, { data: sedes }, { data: mediciones }] = await Promise.all([
    supabase.from("alumnos").select("*").eq("id", id).single(),
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("sedes").select("id, nombre").order("nombre"),
    supabase
      .from("mediciones_antropometricas")
      .select("id, fecha_medicion, peso_kg, talla_cm, imc, notas")
      .eq("alumno_id", id)
      .order("fecha_medicion", { ascending: false }),
  ]);

  if (!alumno) notFound();

  const actualizarConId = actualizarAlumno.bind(null, id);
  const crearMedicionConId = crearMedicion.bind(null, id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Editar Alumno</h1>
      <p className="text-sm text-neutral-500">{alumno.nombre} {alumno.apellido}</p>

      <form action={actualizarConId} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <AlumnoFormFields categorias={categorias ?? []} sedes={sedes ?? []} defaultValues={alumno} />
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Guardar Cambios
        </button>
      </form>

      <div className="mt-6 max-w-xl rounded-xl border border-neutral-200 bg-white p-6">
        <div className="font-semibold text-neutral-900">Evaluaciones (mediciones antropométricas)</div>
        <p className="mt-1 text-xs text-neutral-400">
          Percentil OMS no se calcula todavía — falta el dato de sexo en la ficha del alumno.
        </p>

        <div className="mt-4 space-y-2">
          {mediciones && mediciones.length > 0 ? (
            mediciones.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm">
                <span className="text-neutral-700">{m.fecha_medicion} — {m.peso_kg} kg, {m.talla_cm} cm</span>
                <span className="text-xs text-neutral-500">IMC {m.imc ?? "—"}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-400">Sin evaluaciones registradas todavía.</div>
          )}
        </div>

        <form action={crearMedicionConId} className="mt-4 flex flex-wrap items-end gap-2 border-t border-neutral-200 pt-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600">Fecha</label>
            <input type="date" name="fecha_medicion" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Peso (kg)</label>
            <input type="number" step="0.1" name="peso_kg" required className="mt-1 w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Talla (cm)</label>
            <input type="number" step="0.1" name="talla_cm" required className="mt-1 w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-600">Notas</label>
            <input name="notas" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-dr-neutral-900 px-4 py-2 text-sm font-medium text-white">
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
}
