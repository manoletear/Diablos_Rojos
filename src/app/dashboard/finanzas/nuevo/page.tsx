import { createClient } from "@/lib/supabase/server";
import { crearPago } from "../actions";

export default async function NuevoPagoPage() {
  const supabase = await createClient();
  const { data: alumnos } = await supabase.from("alumnos").select("id, nombre, apellido").order("apellido");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Nuevo Pago</h1>

      <form action={crearPago} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Alumno</label>
          <select name="alumno_id" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Seleccionar</option>
            {alumnos?.map((a) => <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Tipo</label>
          <select name="tipo" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="mensualidad">Mensualidad</option>
            <option value="matricula">Matrícula</option>
            <option value="uniforme">Uniforme</option>
            <option value="torneo">Torneo</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Periodo (opcional)</label>
          <input name="periodo" placeholder="octubre de 2026" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Monto</label>
            <input type="number" name="monto_total" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Vencimiento</label>
            <input type="date" name="fecha_vencimiento" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Crear Pago
        </button>
      </form>
    </div>
  );
}
