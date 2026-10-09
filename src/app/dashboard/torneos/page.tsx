import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function money(n: number | null) {
  if (n === null) return null;
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

const TIPO_LABEL: Record<string, string> = { un_dia: "Un Día", corto_plazo: "Corto Plazo", anual: "Anual" };

export default async function TorneosPage() {
  const supabase = await createClient();

  const { data: torneos, error } = await supabase
    .from("torneos")
    .select("id, nombre, tipo, fecha_inicio, fecha_fin, estado, precio, obligatorio, requiere_aprobacion, sedes(nombre), torneo_categorias(categorias(nombre)), partidos(count)")
    .order("fecha_inicio", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Torneos</h1>
          <p className="text-sm text-neutral-500">Gestiona los torneos de tu academia</p>
        </div>
        <Link href="/dashboard/torneos/nuevo" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + Crear Torneo
        </Link>
      </div>

      {error && <div className="mt-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error.message}</div>}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Torneos ({torneos?.length ?? 0})</div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-3">Nombre</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Fechas</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Sede</th>
                <th className="px-3 py-3">Categorías</th>
                <th className="px-3 py-3">Partidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {torneos && torneos.length > 0 ? (
                torneos.map((t) => {
                  const cats = (t.torneo_categorias as unknown as { categorias: { nombre: string } | null }[]) ?? [];
                  const sede = (t.sedes as unknown as { nombre: string } | null)?.nombre;
                  const partidosCount = (t.partidos as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
                  return (
                    <tr key={t.id}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-neutral-900">{t.nombre}</div>
                        <div className="mt-1 flex gap-1">
                          {t.precio !== null && (
                            <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-xs">{money(t.precio)}</span>
                          )}
                          {t.obligatorio && <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">Obligatorio</span>}
                          {t.requiere_aprobacion && <span className="rounded bg-warning-bg px-1.5 py-0.5 text-xs text-warning">Requiere aprobación</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3"><span className="rounded border border-neutral-300 px-2 py-0.5 text-xs">{TIPO_LABEL[t.tipo] ?? t.tipo}</span></td>
                      <td className="px-3 py-3 text-neutral-600">
                        {t.fecha_inicio ?? "—"}<br />{t.fecha_fin ?? ""}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${t.estado === "activo" ? "bg-success-bg text-success" : "bg-neutral-100 text-neutral-500"}`}>
                          {t.estado}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-neutral-600">{sede ?? "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {cats.map((c, i) => (
                            <span key={i} className="rounded border border-neutral-300 px-2 py-0.5 text-xs">{c.categorias?.nombre}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-neutral-600">{partidosCount}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                    Sin torneos todavía. Crea el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
