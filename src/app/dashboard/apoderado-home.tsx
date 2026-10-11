import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function money(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

const ESTADO_PAGO_STYLE: Record<string, string> = {
  pendiente: "bg-warning-bg text-warning",
  parcial: "bg-info-bg text-info",
  por_comprobar: "bg-purple-50 text-purple-700",
  pagado: "bg-success-bg text-success",
  vencido: "bg-error-bg text-error",
};

export async function ApoderadoHome({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: apoderado } = await supabase.from("apoderados").select("id, nombre").eq("profile_id", userId).maybeSingle();

  if (!apoderado) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Bienvenido</h1>
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">
            Tu cuenta todavía no está vinculada a ningún alumno. Contacta al club para que te asocien a tu(s) hijo(s).
          </p>
        </div>
      </div>
    );
  }

  const { data: vinculos } = await supabase
    .from("apoderado_alumno")
    .select("alumno_id, parentesco, es_principal, alumnos(id, nombre, apellido, estado, categoria_id, categorias(nombre))")
    .eq("apoderado_id", apoderado.id);

  const hijos = (vinculos ?? [])
    .map((v) => v.alumnos as unknown as { id: string; nombre: string; apellido: string; estado: string; categoria_id: string | null; categorias: { nombre: string } | null } | null)
    .filter((a): a is NonNullable<typeof a> => !!a);

  const alumnoIds = hijos.map((h) => h.id);
  const categoriaIds = [...new Set(hijos.map((h) => h.categoria_id).filter(Boolean))] as string[];

  const [{ data: pagos }, { data: proximosPartidos }, { data: asistenciaReciente }] = await Promise.all([
    alumnoIds.length > 0
      ? supabase.from("pagos").select("id, alumno_id, tipo, periodo, monto_total, monto_pagado, estado, fecha_vencimiento").in("alumno_id", alumnoIds).neq("estado", "pagado").order("fecha_vencimiento", { ascending: true })
      : Promise.resolve({ data: [] }),
    categoriaIds.length > 0
      ? supabase.from("partidos").select("id, rival, fecha_hora, categoria_id, categorias(nombre)").in("categoria_id", categoriaIds).gte("fecha_hora", new Date().toISOString()).order("fecha_hora", { ascending: true }).limit(5)
      : Promise.resolve({ data: [] }),
    alumnoIds.length > 0
      ? supabase.from("registros_asistencia").select("alumno_id, estado, sesiones_entrenamiento(fecha)").in("alumno_id", alumnoIds).order("sesion_id", { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Hola, {apoderado.nombre.split(" ")[0]}</h1>
      <p className="text-sm text-neutral-500">Resumen de tu familia en Diablos Rojos</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hijos.map((h) => (
          <div key={h.id} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="font-semibold text-neutral-900">{h.nombre} {h.apellido}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
              <span className="rounded border border-neutral-300 px-2 py-0.5">{h.categorias?.nombre ?? "Sin categoría"}</span>
              <span className="capitalize">{h.estado.replace("_", " ")}</span>
            </div>
          </div>
        ))}
        {hijos.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-400 sm:col-span-2">
            No tienes alumnos vinculados todavía.
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-neutral-900">Pagos pendientes</div>
            <Link href="/dashboard/finanzas" className="text-sm font-medium text-primary-600">Ver todos</Link>
          </div>
          <div className="mt-4 space-y-2">
            {pagos && pagos.length > 0 ? (
              pagos.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-neutral-800">{p.tipo === "matricula" ? "Matrícula" : p.periodo ?? p.tipo}</div>
                    <div className="text-xs text-neutral-400">Vence {p.fecha_vencimiento ?? "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-neutral-900">{money(Number(p.monto_total) - Number(p.monto_pagado))}</div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_PAGO_STYLE[p.estado]}`}>{p.estado}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-neutral-400">Sin pagos pendientes. 🎉</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-neutral-900">Próximos partidos</div>
            <Link href="/dashboard/calendario" className="text-sm font-medium text-primary-600">Ver calendario</Link>
          </div>
          <div className="mt-4 space-y-2">
            {proximosPartidos && proximosPartidos.length > 0 ? (
              proximosPartidos.map((p) => {
                const cat = (p.categorias as unknown as { nombre: string } | null)?.nombre;
                const fecha = new Date(p.fecha_hora);
                return (
                  <div key={p.id} className="rounded-md bg-neutral-50 px-3 py-2 text-sm">
                    <div className="font-medium text-neutral-800">{cat} vs {p.rival}</div>
                    <div className="text-xs text-neutral-400">
                      {fecha.toLocaleDateString("es-CL")} {fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-neutral-400">Sin partidos programados.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Asistencia reciente</div>
        <div className="mt-4 space-y-1.5">
          {asistenciaReciente && asistenciaReciente.length > 0 ? (
            asistenciaReciente.map((r, i) => {
              const alumno = hijos.find((h) => h.id === r.alumno_id);
              const fecha = (r.sesiones_entrenamiento as unknown as { fecha: string } | null)?.fecha;
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{alumno?.nombre ?? "—"} — {fecha ?? "—"}</span>
                  <span className="capitalize text-neutral-500">{r.estado}</span>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-neutral-400">Sin registros de asistencia todavía.</div>
          )}
        </div>
      </div>
    </div>
  );
}
