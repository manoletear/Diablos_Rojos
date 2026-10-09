import { createClient } from "@/lib/supabase/server";
import { crearPartido } from "../actions";

export default async function NuevoPartidoPage() {
  const supabase = await createClient();
  const [{ data: categorias }, { data: torneos }] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("torneos").select("id, nombre").order("nombre"),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Nuevo Partido</h1>

      <form action={crearPartido} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Categoría</label>
          <select name="categoria_id" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Seleccionar</option>
            {categorias?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Rival</label>
          <input name="rival" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Torneo (opcional)</label>
          <select name="torneo_id" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Sin torneo</option>
            {torneos?.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Fecha</label>
            <input type="date" name="fecha" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Hora</label>
            <input type="time" name="hora" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Recinto</label>
          <input name="recinto" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Condición</label>
          <select name="local_o_visita" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="local">Local</option>
            <option value="visita">Visita</option>
          </select>
        </div>
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Crear Partido
        </button>
      </form>
    </div>
  );
}
