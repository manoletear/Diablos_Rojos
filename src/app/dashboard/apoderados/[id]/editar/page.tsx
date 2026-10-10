import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarApoderado, vincularAlumno } from "../../actions";

export default async function EditarApoderadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: apoderado }, { data: hijos }, { data: alumnos }] = await Promise.all([
    supabase.from("apoderados").select("*").eq("id", id).single(),
    supabase.from("apoderado_alumno").select("relacion, es_principal, alumnos(id, nombre, apellido)").eq("apoderado_id", id),
    supabase.from("alumnos").select("id, nombre, apellido").order("apellido"),
  ]);

  if (!apoderado) notFound();

  const actualizarConId = actualizarApoderado.bind(null, id);
  const vincularConId = vincularAlumno.bind(null, id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Editar Apoderado</h1>
      <p className="text-sm text-neutral-500">{apoderado.nombre}</p>

      <form action={actualizarConId} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Nombre</label>
          <input name="nombre" required defaultValue={apoderado.nombre} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Email</label>
            <input type="email" name="email" defaultValue={apoderado.email ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Teléfono</label>
            <input name="telefono" defaultValue={apoderado.telefono ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Guardar Cambios
        </button>
      </form>

      <div className="mt-6 max-w-xl rounded-xl border border-neutral-200 bg-white p-6">
        <div className="font-semibold text-neutral-900">Hijos vinculados</div>
        <div className="mt-3 space-y-2">
          {hijos && hijos.length > 0 ? (
            hijos.map((h, i) => {
              const al = h.alumnos as unknown as { id: string; nombre: string; apellido: string } | null;
              return (
                <div key={i} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm">
                  <span>{al?.nombre} {al?.apellido}</span>
                  <span className="text-xs text-neutral-500 capitalize">{h.relacion}{h.es_principal ? " · titular" : ""}</span>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-neutral-400">Sin hijos vinculados todavía.</div>
          )}
        </div>

        <form action={vincularConId} className="mt-4 flex items-end gap-2 border-t border-neutral-200 pt-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-600">Vincular nuevo alumno</label>
            <select name="alumno_id" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
              <option value="">Seleccionar</option>
              {alumnos?.map((a) => <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>)}
            </select>
          </div>
          <select name="relacion" className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="tutor">Tutor</option>
            <option value="madre">Madre</option>
            <option value="padre">Padre</option>
          </select>
          <button type="submit" className="rounded-md bg-dr-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-dr-neutral-800">
            Vincular
          </button>
        </form>
      </div>
    </div>
  );
}
