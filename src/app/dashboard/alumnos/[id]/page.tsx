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

export default async function PerfilAlumnoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from("profiles").select("rol").eq("id", user?.id ?? "").maybeSingle();
  const puedeEditar = perfil?.rol === "director" || perfil?.rol === "admin" || perfil?.rol === "entrenador";

  // RLS ya filtra: si no corresponde (ej. apoderado viendo un alumno que no
  // es suyo), esto vuelve null y cae en notFound().
  const { data: alumno } = await supabase
    .from("alumnos")
    .select("*, categorias(nombre), sedes(nombre)")
    .eq("id", id)
    .maybeSingle();

  if (!alumno) notFound();

  const [{ data: apoderados }, { data: asistencias }, { data: mediciones }, { data: convocatorias }] = await Promise.all([
    supabase
      .from("apoderado_alumno")
      .select("parentesco, es_principal, apoderados(nombre, telefono, email, direccion, contacto_emergencia, telefono_emergencia)")
      .eq("alumno_id", id),
    supabase
      .from("registros_asistencia")
      .select("estado, sesiones_entrenamiento(fecha)")
      .eq("alumno_id", id)
      .order("sesion_id", { ascending: false })
      .limit(10),
    supabase
      .from("mediciones_antropometricas")
      .select("id, fecha_medicion, peso_kg, talla_cm, imc")
      .eq("alumno_id", id)
      .order("fecha_medicion", { ascending: false })
      .limit(5),
    supabase
      .from("convocatoria_jugadores")
      .select("estado, convocatorias(partidos(rival, fecha_hora))")
      .eq("alumno_id", id),
  ]);

  const presentes = (asistencias ?? []).filter((r) => r.estado === "presente" || r.estado === "tardanza").length;
  const pctAsistencia = (asistencias ?? []).length > 0 ? Math.round((presentes / (asistencias ?? []).length) * 100) : null;

  const convocatoriasOrdenadas = [...(convocatorias ?? [])]
    .sort((a, b) => {
      const fa = (a.convocatorias as unknown as { partidos: { fecha_hora: string } | null } | null)?.partidos?.fecha_hora ?? "";
      const fb = (b.convocatorias as unknown as { partidos: { fecha_hora: string } | null } | null)?.partidos?.fecha_hora ?? "";
      return fb.localeCompare(fa);
    })
    .slice(0, 8);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/alumnos" className="text-sm text-primary-600 hover:underline">← Volver</Link>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">{alumno.nombre} {alumno.apellido}</h1>
          <p className="text-sm text-neutral-500">
            {(alumno.categorias as unknown as { nombre: string } | null)?.nombre ?? "Sin categoría"}
            {alumno.numero_camiseta ? ` · #${alumno.numero_camiseta}` : ""}
          </p>
        </div>
        {puedeEditar && (
          <Link href={`/dashboard/alumnos/${id}/editar`} className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
            Editar
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">Asistencia</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">{pctAsistencia !== null ? `${pctAsistencia}%` : "—"}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">Estado</div>
          <div className="mt-1 text-2xl font-bold capitalize text-neutral-900">{alumno.estado.replace("_", " ")}</div>
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
            <div className="flex justify-between"><span className="text-neutral-500">Sede</span><span>{(alumno.sedes as unknown as { nombre: string } | null)?.nombre ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Posición</span><span>{alumno.posicion ?? "—"}</span></div>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4 font-semibold text-neutral-900">Apoderados</div>
          <div className="mt-3 space-y-2 text-sm">
            {(apoderados ?? []).map((a, i) => {
              const ap = a.apoderados as unknown as {
                nombre: string;
                telefono: string | null;
                email: string | null;
                direccion: string | null;
                contacto_emergencia: string | null;
                telefono_emergencia: string | null;
              } | null;
              return (
                <div key={i} className="rounded-md bg-neutral-50 px-3 py-2">
                  <div className="flex items-center gap-1.5 font-medium text-neutral-800">
                    {ap?.nombre}
                    <span className="text-xs font-normal text-neutral-400">
                      ({a.parentesco ?? "—"}{a.es_principal ? " · Principal" : ""})
                    </span>
                    {ap?.telefono && (
                      <a
                        href={`https://wa.me/${ap.telefono.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto text-success"
                        title="Contactar por WhatsApp"
                      >
                        ●
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">{ap?.telefono ?? "—"} · {ap?.email ?? "—"}</div>
                  {ap?.direccion && <div className="text-xs text-neutral-400">{ap.direccion}</div>}
                  {(ap?.contacto_emergencia || ap?.telefono_emergencia) && (
                    <div className="mt-1 text-xs text-error">
                      Emergencia: {ap?.contacto_emergencia ?? "—"} {ap?.telefono_emergencia ? `· ${ap.telefono_emergencia}` : ""}
                    </div>
                  )}
                </div>
              );
            })}
            {(apoderados ?? []).length === 0 && <div className="text-neutral-400">Sin apoderados vinculados.</div>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="font-semibold text-neutral-900">Asistencias recientes</div>
            <div className="mt-3 space-y-1.5 text-sm">
              {asistencias && asistencias.length > 0 ? (
                asistencias.map((r, i) => {
                  const sesion = r.sesiones_entrenamiento as unknown as { fecha: string } | null;
                  return (
                    <div key={i} className="flex justify-between">
                      <span className="text-neutral-600">{sesion?.fecha ?? "—"}</span>
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
              {convocatoriasOrdenadas.length > 0 ? (
                convocatoriasOrdenadas.map((c, i) => {
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

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="font-semibold text-neutral-900">Evaluaciones recientes</div>
            <div className="mt-3 space-y-1.5 text-sm">
              {mediciones && mediciones.length > 0 ? (
                mediciones.map((m) => (
                  <div key={m.id} className="flex justify-between">
                    <span className="text-neutral-600">{m.fecha_medicion} — {m.peso_kg} kg, {m.talla_cm} cm</span>
                    <span className="text-xs text-neutral-500">IMC {m.imc ?? "—"}</span>
                  </div>
                ))
              ) : (
                <div className="text-neutral-400">Sin evaluaciones todavía.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
