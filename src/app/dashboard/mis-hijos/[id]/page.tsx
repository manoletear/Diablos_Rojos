import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function edad(fechaNacimiento: string | null) {
  if (!fechaNacimiento) return null;
  const fn = new Date(fechaNacimiento);
  const hoy = new Date();
  let e = hoy.getFullYear() - fn.getFullYear();
  const m = hoy.getMonth() - fn.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) e--;
  return e;
}

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

export default async function PerfilHijoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS (apoderado_read_alumnos) ya garantiza que solo se puede ver un
  // alumno vinculado a este apoderado — si no es tuyo, esto vuelve null.
  const { data: alumno } = await supabase
    .from("alumnos")
    .select("*, categorias(nombre), sedes(nombre)")
    .eq("id", id)
    .maybeSingle();

  if (!alumno) notFound();

  const [
    { data: apoderados },
    { data: asistencias },
    { data: pagos },
    { data: convocatorias },
    { data: matriculasCategoria },
    { data: matriculasSede },
  ] = await Promise.all([
    supabase.from("apoderado_alumno").select("parentesco, es_principal, apoderados(nombre, telefono, email)").eq("alumno_id", id),
    supabase
      .from("registros_asistencia")
      .select("estado, sesiones_entrenamiento(fecha, categorias(nombre))")
      .eq("alumno_id", id)
      .order("sesion_id", { ascending: false })
      .limit(10),
    supabase.from("pagos").select("id, tipo, periodo, monto_total, monto_pagado, estado, fecha_vencimiento").eq("alumno_id", id).order("fecha_vencimiento", { ascending: false }),
    supabase
      .from("convocatoria_jugadores")
      .select("estado, convocatorias(partidos(rival, fecha_hora))")
      .eq("alumno_id", id)
      .order("convocatoria_id", { ascending: false })
      .limit(10),
    supabase.from("matriculas_categoria").select("estado, created_at, categorias(nombre)").eq("alumno_id", id),
    supabase.from("matriculas_sede").select("estado, fecha_inicio, fecha_fin, sedes(nombre)").eq("alumno_id", id),
  ]);

  const presentes = (asistencias ?? []).filter((r) => r.estado === "presente" || r.estado === "tardanza").length;
  const pctAsistencia = (asistencias ?? []).length > 0 ? Math.round((presentes / (asistencias ?? []).length) * 100) : null;
  const pendientePorPagar = (pagos ?? []).reduce((acc, p) => (p.estado !== "pagado" ? acc + (Number(p.monto_total) - Number(p.monto_pagado)) : acc), 0);

  return (
    <div className="p-6">
      <Link href="/dashboard/mis-hijos" className="text-sm text-primary-600 hover:underline">← Volver</Link>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900">{alumno.nombre} {alumno.apellido}</h1>
      <p className="text-sm text-neutral-500">{(alumno.categorias as unknown as { nombre: string } | null)?.nombre ?? "Sin categoría"}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">Asistencia</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">{pctAsistencia !== null ? `${pctAsistencia}%` : "—"}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">Pendiente por pagar</div>
          <div className="mt-1 text-2xl font-bold text-error">{money(pendientePorPagar)}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">Convocatorias</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">{convocatorias?.length ?? 0}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="font-semibold text-neutral-900">Información Personal</div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Edad</span><span>{edad(alumno.fecha_nacimiento) ?? "—"} años</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Fecha de nacimiento</span><span>{alumno.fecha_nacimiento ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Estado</span><span className="capitalize">{alumno.estado.replace("_", " ")}</span></div>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4 font-semibold text-neutral-900">Información Deportiva</div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Categoría</span><span>{(alumno.categorias as unknown as { nombre: string } | null)?.nombre ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Sede</span><span>{(alumno.sedes as unknown as { nombre: string } | null)?.nombre ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Número</span><span>{alumno.numero_camiseta ? `#${alumno.numero_camiseta}` : "Sin asignar"}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Posición</span><span>{alumno.posicion ?? "—"}</span></div>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4 font-semibold text-neutral-900">Apoderados</div>
          <div className="mt-3 space-y-2 text-sm">
            {(apoderados ?? []).map((a, i) => {
              const ap = a.apoderados as unknown as { nombre: string; telefono: string | null; email: string | null } | null;
              return (
                <div key={i} className="rounded-md bg-neutral-50 px-3 py-2">
                  <div className="font-medium text-neutral-800">{ap?.nombre} <span className="text-xs font-normal text-neutral-400">({a.parentesco ?? "—"}{a.es_principal ? " · Principal" : ""})</span></div>
                  <div className="text-xs text-neutral-500">{ap?.telefono ?? "—"} · {ap?.email ?? "—"}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4 font-semibold text-neutral-900">Matrículas</div>
          <div className="mt-3 space-y-1.5 text-sm">
            {(matriculasCategoria ?? []).map((m, i) => (
              <div key={`c-${i}`} className="flex justify-between">
                <span className="text-neutral-500">{(m.categorias as unknown as { nombre: string } | null)?.nombre}</span>
                <span className="capitalize">{m.estado}</span>
              </div>
            ))}
            {(matriculasSede ?? []).map((m, i) => (
              <div key={`s-${i}`} className="flex justify-between">
                <span className="text-neutral-500">{(m.sedes as unknown as { nombre: string } | null)?.nombre} · {m.fecha_inicio}</span>
                <span className="capitalize">{m.estado}</span>
              </div>
            ))}
            {(matriculasCategoria ?? []).length === 0 && (matriculasSede ?? []).length === 0 && (
              <div className="text-neutral-400">Sin matrículas registradas.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="font-semibold text-neutral-900">Historial de Pagos</div>
            <div className="mt-3 space-y-1.5">
              {pagos && pagos.length > 0 ? (
                pagos.map((p) => (
                  <Link key={p.id} href={`/dashboard/finanzas/${p.id}`} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm hover:bg-neutral-100">
                    <span>{p.tipo === "matricula" ? "Matrícula" : p.periodo ?? p.tipo}</span>
                    <span className="flex items-center gap-2">
                      {money(Number(p.monto_total))}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_PAGO_STYLE[p.estado]}`}>{p.estado}</span>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-sm text-neutral-400">Sin pagos registrados.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="font-semibold text-neutral-900">Historial de Asistencias</div>
            <div className="mt-3 space-y-1.5 text-sm">
              {asistencias && asistencias.length > 0 ? (
                asistencias.map((r, i) => {
                  const sesion = r.sesiones_entrenamiento as unknown as { fecha: string; categorias: { nombre: string } | null } | null;
                  return (
                    <div key={i} className="flex justify-between">
                      <span className="text-neutral-600">{sesion?.fecha} · {sesion?.categorias?.nombre}</span>
                      <span className="capitalize text-neutral-500">{r.estado}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-neutral-400">Sin registros todavía.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="font-semibold text-neutral-900">Convocatorias a Partidos</div>
            <div className="mt-3 space-y-1.5 text-sm">
              {convocatorias && convocatorias.length > 0 ? (
                convocatorias.map((c, i) => {
                  const partido = (c.convocatorias as unknown as { partidos: { rival: string; fecha_hora: string } | null } | null)?.partidos;
                  if (!partido) return null;
                  return (
                    <div key={i} className="flex justify-between">
                      <span className="text-neutral-600">vs {partido.rival} · {new Date(partido.fecha_hora).toLocaleDateString("es-CL")}</span>
                      <span className="capitalize text-neutral-500">{c.estado}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-neutral-400">Sin convocatorias todavía.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
