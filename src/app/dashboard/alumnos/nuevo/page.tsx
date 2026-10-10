import { createClient } from "@/lib/supabase/server";
import { crearAlumno } from "../actions";
import { AlumnoFormFields } from "@/components/alumno-form";

export default async function NuevoAlumnoPage() {
  const supabase = await createClient();
  const [{ data: categorias }, { data: sedes }] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("sedes").select("id, nombre").order("nombre"),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Nuevo Alumno</h1>

      <form action={crearAlumno} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <AlumnoFormFields categorias={categorias ?? []} sedes={sedes ?? []} />
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Crear Alumno
        </button>
      </form>
    </div>
  );
}
