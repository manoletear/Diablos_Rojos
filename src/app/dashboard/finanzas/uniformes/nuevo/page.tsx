import { createClient } from "@/lib/supabase/server";
import { crearPedidoUniforme } from "../actions";

export default async function NuevoPedidoUniformePage() {
  const supabase = await createClient();
  const { data: alumnos } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido, categorias(nombre)")
    .eq("estado", "matriculado")
    .order("apellido");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Nuevo Pedido de Uniforme</h1>

      <form action={crearPedidoUniforme} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Alumno</label>
          <select name="alumno_id" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Seleccionar</option>
            {alumnos?.map((a) => {
              const cat = (a.categorias as unknown as { nombre: string } | null)?.nombre;
              return <option key={a.id} value={a.id}>{a.nombre} {a.apellido} — {cat}</option>;
            })}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Número</label>
            <input type="number" name="numero_camiseta" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Talla camiseta</label>
            <input name="talla_camiseta" placeholder="S / M / L / 14 / 16..." className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Talla short</label>
            <input name="talla_short" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Motivo</label>
          <select name="motivo" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="inicial">Inicial</option>
            <option value="reposicion">Reposición</option>
            <option value="cambio_numero">Cambio de número</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="pago_requerido" defaultChecked /> Requiere pago (desmarcar si va incluido en matrícula)
        </label>
        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Crear Pedido
        </button>
      </form>
    </div>
  );
}
