import { createClient } from "@/lib/supabase/server";
import { crearApoderado } from "../actions";

export default async function NuevoApoderadoPage() {
  const supabase = await createClient();
  const { data: alumnos } = await supabase.from("alumnos").select("id, nombre, apellido").order("apellido");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Nuevo Apoderado</h1>

      <form action={crearApoderado} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Nombre</label>
          <input name="nombre" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Email</label>
            <input type="email" name="email" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Teléfono</label>
            <input name="telefono" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="border-t border-neutral-200 pt-4">
          <label className="block text-sm font-medium text-neutral-700">Vincular a alumno (opcional)</label>
          <select name="alumno_id" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Sin vincular ahora</option>
            {alumnos?.map((a) => <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>)}
          </select>
          <div className="mt-2 flex gap-3">
            <select name="relacion" className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
              <option value="tutor">Tutor</option>
              <option value="madre">Madre</option>
              <option value="padre">Padre</option>
              <option value="otro">Otro</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" name="es_principal" defaultChecked /> Es titular
            </label>
          </div>
        </div>
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Crear Apoderado
        </button>
      </form>
    </div>
  );
}
