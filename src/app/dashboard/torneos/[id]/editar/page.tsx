import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarTorneo } from "../../actions";

export default async function EditarTorneoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: torneo }, { data: categorias }, { data: seleccionadas }] = await Promise.all([
    supabase.from("torneos").select("*").eq("id", id).single(),
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("torneo_categorias").select("categoria_id").eq("torneo_id", id),
  ]);
  if (!torneo) notFound();

  const seleccionadasIds = new Set((seleccionadas ?? []).map((s) => s.categoria_id));
  const actualizarConId = actualizarTorneo.bind(null, id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Editar Torneo</h1>

      <form action={actualizarConId} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Nombre</label>
          <input name="nombre" defaultValue={torneo.nombre} required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Tipo</label>
          <select name="tipo" defaultValue={torneo.tipo} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="un_dia">Un Día</option>
            <option value="corto_plazo">Corto Plazo</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Estado</label>
          <select name="estado" defaultValue={torneo.estado} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="planificado">Planificado</option>
            <option value="activo">Activo</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Fecha inicio</label>
            <input type="date" name="fecha_inicio" defaultValue={torneo.fecha_inicio ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Fecha fin</label>
            <input type="date" name="fecha_fin" defaultValue={torneo.fecha_fin ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Precio (opcional)</label>
          <input type="number" name="precio" defaultValue={torneo.precio ?? ""} placeholder="$" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Categorías participantes</label>
          <div className="mt-1 grid grid-cols-2 gap-1 rounded-md border border-neutral-300 p-2">
            {categorias?.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="categoria_id" value={c.id} defaultChecked={seleccionadasIds.has(c.id)} />
                {c.nombre}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="obligatorio" defaultChecked={torneo.obligatorio} /> Obligatorio
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="requiere_aprobacion" defaultChecked={torneo.requiere_aprobacion} /> Requiere aprobación
          </label>
        </div>
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
