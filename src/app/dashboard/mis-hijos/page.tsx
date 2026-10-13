import Link from "next/link";
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

export default async function MisHijosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: apoderado } = await supabase.from("apoderados").select("id").eq("profile_id", user?.id ?? "").maybeSingle();

  if (!apoderado) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mis Hijos</h1>
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Tu cuenta todavía no está vinculada a ningún alumno.
        </div>
      </div>
    );
  }

  const { data: vinculos } = await supabase
    .from("apoderado_alumno")
    .select("alumnos(id, nombre, apellido, fecha_nacimiento, estado, numero_camiseta, categorias(nombre))")
    .eq("apoderado_id", apoderado.id);

  const hijos = (vinculos ?? [])
    .map(
      (v) =>
        v.alumnos as unknown as {
          id: string;
          nombre: string;
          apellido: string;
          fecha_nacimiento: string | null;
          estado: string;
          numero_camiseta: number | null;
          categorias: { nombre: string } | null;
        } | null
    )
    .filter((a): a is NonNullable<typeof a> => !!a);

  const alumnoIds = hijos.map((h) => h.id);

  const [{ data: asistencias }, { data: pagos }, { data: minutajes }] = await Promise.all([
    alumnoIds.length > 0
      ? supabase.from("registros_asistencia").select("alumno_id, estado").in("alumno_id", alumnoIds)
      : Promise.resolve({ data: [] }),
    alumnoIds.length > 0
      ? supabase.from("pagos").select("alumno_id, monto_total, monto_pagado, estado").in("alumno_id", alumnoIds).neq("estado", "pagado")
      : Promise.resolve({ data: [] }),
    alumnoIds.length > 0
      ? supabase.from("minutajes_partido").select("alumno_id, goles").in("alumno_id", alumnoIds)
      : Promise.resolve({ data: [] }),
  ]);

  function statsDe(alumnoId: string) {
    const regs = (asistencias ?? []).filter((r) => r.alumno_id === alumnoId);
    const presentes = regs.filter((r) => r.estado === "presente" || r.estado === "tardanza").length;
    const pctAsistencia = regs.length > 0 ? Math.round((presentes / regs.length) * 100) : null;

    const pagosAlumno = (pagos ?? []).filter((p) => p.alumno_id === alumnoId);
    const nPendientes = pagosAlumno.length;
    const montoPendiente = pagosAlumno.reduce((acc, p) => acc + (Number(p.monto_total) - Number(p.monto_pagado)), 0);

    const partidosAlumno = (minutajes ?? []).filter((m) => m.alumno_id === alumnoId);
    const goles = partidosAlumno.reduce((acc, m) => acc + (m.goles ?? 0), 0);

    return { pctAsistencia, nPendientes, montoPendiente, nPartidos: partidosAlumno.length, goles };
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Mis Hijos</h1>
      <p className="text-sm text-neutral-500">Tus hijos en Diablos Rojos</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hijos.map((h) => {
          const s = statsDe(h.id);
          return (
            <div key={h.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-900">{h.nombre} {h.apellido}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                    <span>{edad(h.fecha_nacimiento) ?? "—"} años</span>
                    <span className="rounded border border-neutral-300 px-2 py-0.5">{h.categorias?.nombre ?? "Sin categoría"}</span>
                    {h.numero_camiseta && <span className="rounded border border-neutral-300 px-1.5 py-0.5">#{h.numero_camiseta}</span>}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${h.estado === "matriculado" ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}>
                  {h.estado === "matriculado" ? "Matriculado" : h.estado.replace("_", " ")}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-neutral-50 py-2">
                  <div className="font-semibold text-neutral-900">{s.pctAsistencia !== null ? `${s.pctAsistencia}%` : "—"}</div>
                  <div className="text-neutral-400">Asistencia</div>
                </div>
                <div className="rounded-md bg-neutral-50 py-2">
                  <div className="font-semibold text-neutral-900">{s.nPartidos}</div>
                  <div className="text-neutral-400">Partidos</div>
                </div>
                <div className="rounded-md bg-neutral-50 py-2">
                  <div className="font-semibold text-neutral-900">{s.goles}</div>
                  <div className="text-neutral-400">Goles</div>
                </div>
              </div>

              {s.nPendientes > 0 && (
                <div className="mt-3 rounded-md bg-warning-bg px-3 py-1.5 text-xs text-warning">
                  {s.nPendientes} pago(s) pendiente(s) · {money(s.montoPendiente)}
                </div>
              )}

              <Link href={`/dashboard/mis-hijos/${h.id}`} className="mt-4 block rounded-md border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                Ver Perfil
              </Link>
            </div>
          );
        })}
        {hijos.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-400 sm:col-span-2">
            No tienes alumnos vinculados todavía.
          </div>
        )}
      </div>
    </div>
  );
}
