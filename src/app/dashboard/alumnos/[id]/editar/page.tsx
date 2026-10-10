import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarAlumno } from "../../actions";
import { AlumnoFormFields } from "@/components/alumno-form";

export default async function EditarAlumnoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: alumno }, { data: categorias }, { data: sedes }] = await Promise.all([
    supabase.from("alumnos").select("*").eq("id", id).single(),
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("sedes").select("id, nombre").order("nombre"),
  ]);

  if (!alumno) notFound();

  const actualizarConId = actualizarAlumno.bind(null, id);

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
    </div>
  );
}
