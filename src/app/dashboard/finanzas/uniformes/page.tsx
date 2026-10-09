import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function money(n: number | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

const ESTADO_STYLE: Record<string, string> = {
  pendiente_pago: "bg-warning-bg text-warning",
  pagado: "bg-info-bg text-info",
  enviado_proveedor: "bg-purple-50 text-purple-700",
  en_produccion: "bg-purple-50 text-purple-700",
  entregado: "bg-success-bg text-success",
  cancelado: "bg-error-bg text-error",
};
const ESTADO_LABEL: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  enviado_proveedor: "Enviado a proveedor",
  en_produccion: "En producción",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default async function UniformesPage() {
  const supabase = await createClient();

  const { data: pedidos, error } = await supabase
    .from("uniforme_pedidos")
    .select("id, numero_camiseta, talla_camiseta, talla_short, estado, pago_requerido, monto, motivo, fecha_pedido, alumnos(nombre, apellido), categorias(nombre)")
    .order("fecha_pedido", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Uniformes</h1>
          <p className="text-sm text-neutral-500">Pedidos de camiseta oficial por alumno</p>
        </div>
        <Link href="/dashboard/finanzas/uniformes/nuevo" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + Nuevo Pedido
        </Link>
      </div>

      {error && <div className="mt-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error.message}</div>}

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Alumno</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Talla</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pedidos && pedidos.length > 0 ? (
              pedidos.map((p) => {
                const al = p.alumnos as unknown as { nombre: string; apellido: string } | null;
                const cat = (p.categorias as unknown as { nombre: string } | null)?.nombre;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{al?.nombre} {al?.apellido}</td>
                    <td className="px-4 py-3 text-neutral-600">{cat ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{p.numero_camiseta ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{p.talla_camiseta ?? "—"}{p.talla_short ? ` / ${p.talla_short}` : ""}</td>
                    <td className="px-4 py-3 text-neutral-600 capitalize">{p.motivo.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p.pago_requerido ? money(p.monto) : <span className="text-success">Incluido en matrícula</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[p.estado]}`}>{ESTADO_LABEL[p.estado]}</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Sin pedidos de uniforme todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
