import { createClient } from "@/lib/supabase/server";
import { crearTorneo } from "../actions";

export default async function NuevoTorneoPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase.from("categorias").select("id, nombre").order("nombre");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Crear Torneo</h1>
      <p className="text-sm text-neutral-500">Define un nuevo torneo para la academia</p>

      <form action={crearTorneo} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Nombre</label>
          <input name="nombre" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Tipo</label>
          <select name="tipo" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="un_dia">Un Día</option>
            <option value="corto_plazo">Corto Plazo</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Fecha inicio</label>
            <input type="date" name="fecha_inicio" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Fecha fin</label>
            <input type="date" name="fecha_fin" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Precio (opcional)</label>
          <input type="number" name="precio" placeholder="$" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Categorías participantes</label>
          <div className="mt-1 grid grid-cols-2 gap-1 rounded-md border border-neutral-300 p-2">
            {categorias?.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="categoria_id" value={c.id} />
                {c.nombre}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="obligatorio" /> Obligatorio
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="requiere_aprobacion" /> Requiere aprobación
          </label>
        </div>
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Crear Torneo
        </button>
      </form>
    </div>
  );
}
