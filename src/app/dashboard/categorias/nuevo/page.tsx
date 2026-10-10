import { createClient } from "@/lib/supabase/server";
import { crearCategoria } from "../actions";
import { CategoriaFormFields } from "@/components/categoria-form";

export default async function NuevaCategoriaPage() {
  const supabase = await createClient();
  const [{ data: sedes }, { data: entrenadores }] = await Promise.all([
    supabase.from("sedes").select("id, nombre").order("nombre"),
    supabase.from("entrenadores").select("id, nombre").order("nombre"),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Nueva Categoría</h1>

      <form action={crearCategoria} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <CategoriaFormFields sedes={sedes ?? []} entrenadores={entrenadores ?? []} />
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Crear Categoría
        </button>
      </form>
    </div>
  );
}
