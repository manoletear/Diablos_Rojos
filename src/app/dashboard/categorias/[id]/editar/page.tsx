import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarCategoria } from "../../actions";
import { CategoriaFormFields } from "@/components/categoria-form";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: categoria }, { data: sedes }, { data: entrenadores }] = await Promise.all([
    supabase.from("categorias").select("*").eq("id", id).single(),
    supabase.from("sedes").select("id, nombre").order("nombre"),
    supabase.from("entrenadores").select("id, nombre").order("nombre"),
  ]);

  if (!categoria) notFound();

  const actualizarConId = actualizarCategoria.bind(null, id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Editar Categoría</h1>
      <p className="text-sm text-neutral-500">{categoria.nombre}</p>

      <form action={actualizarConId} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <CategoriaFormFields sedes={sedes ?? []} entrenadores={entrenadores ?? []} defaultValues={categoria} />
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
