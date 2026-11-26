import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmarConvocatoria } from "@/components/confirmar-convocatoria";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmado",
  rechazada: "No va",
};

const ESTADO_STYLE: Record<string, string> = {
  pendiente: "bg-warning-bg text-warning",
  confirmada: "bg-success-bg text-success",
  rechazada: "bg-error-bg text-error",
};

function inicialApellido(apellido: string) {
  return apellido ? `${apellido[0]}.` : "";
}

export default async function ConvocatoriaEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS (apoderado_read_plantel_convocatoria) ya garantiza que solo se ve
  // esto si tienes un hijo convocado acá — si no, vuelve vacío/null.
  const { data: convocatoria } = await supabase
    .from("convocatorias")
    .select("id, partido_id, partidos(rival, fecha_hora, categorias(nombre))")
    .eq("id", id)
    .maybeSingle();

  if (!convocatoria) notFound();
  const partido = convocatoria.partidos as unknown as { rival: string; fecha_hora: string; categorias: { nombre: string } | null } | null;
  if (!partido) notFound();

  // RPC propio (obtener_plantel_convocatoria) en vez de un embed directo a
  // "alumnos": una policy de RLS en alumnos que comparte la misma función
  // de autorización que usa "convocatorias" causaba 42P17 (infinite
  // recursion) incluso en lecturas que no tocaban alumnos para nada — la
  // función hace su propio chequeo de autorización y bypassa RLS adentro.
  const [{ data: plantel }, { data: apoderado }] = await Promise.all([
    supabase.rpc("obtener_plantel_convocatoria", { p_convocatoria_id: id }),
    supabase.from("apoderados").select("id").eq("profile_id", user?.id ?? "").maybeSingle(),
  ]);

  const { data: misHijosAca } = apoderado
    ? await supabase.from("apoderado_alumno").select("alumno_id").eq("apoderado_id", apoderado.id)
    : { data: [] as { alumno_id: string }[] };
  const misAlumnoIds = new Set((misHijosAca ?? []).map((h) => h.alumno_id));

  const confirmados = (plantel ?? []).filter((p) => p.estado === "confirmada").length;
  const pendientes = (plantel ?? []).filter((p) => p.estado === "pendiente").length;
  const rechazados = (plantel ?? []).filter((p) => p.estado === "rechazada").length;

  const yaPaso = new Date(partido.fecha_hora) <= new Date();

  return (
    <div className="p-6">
      <Link href="/dashboard" className="text-sm text-primary-600 hover:underline">← Volver</Link>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900">
        {partido.categorias?.nombre} vs {partido.rival}
      </h1>
      <p className="text-sm text-neutral-500">
        {new Date(partido.fecha_hora).toLocaleDateString("es-CL")} ·{" "}
        {new Date(partido.fecha_hora).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
      </p>

      {yaPaso && (
        <div className="mt-4 rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-500">
          Este partido ya pasó — las respuestas quedaron cerradas.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(plantel ?? [])
          .filter((p) => misAlumnoIds.has(p.alumno_id))
          .map((p) => {
            return (
              <div key={p.alumno_id} className="rounded-xl border border-warning bg-warning-bg p-4">
                <div className="font-semibold text-neutral-900">{p.nombre} {p.apellido} — tu hijo</div>
                <div className="mt-1 text-sm text-neutral-600">
                  Estado actual: <span className="font-medium">{ESTADO_LABEL[p.estado] ?? p.estado}</span>
                </div>
                {!yaPaso && (
                  <div className="mt-3">
                    <ConfirmarConvocatoria convocatoriaId={id} alumnoId={p.alumno_id} />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-neutral-900">Plantel convocado</div>
          <div className="flex gap-3 text-xs text-neutral-500">
            <span className="text-success">{confirmados} confirmados</span>
            <span className="text-warning">{pendientes} pendientes</span>
            <span className="text-error">{rechazados} no van</span>
          </div>
        </div>
        <div className="mt-3 space-y-1.5 text-sm">
          {(plantel ?? []).map((p) => {
            const esMiHijo = misAlumnoIds.has(p.alumno_id);
            return (
              <div key={p.alumno_id} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
                <span className="text-neutral-700">
                  {p.numero_camiseta ? `#${p.numero_camiseta} · ` : ""}
                  {p.nombre} {inicialApellido(p.apellido ?? "")}
                  {esMiHijo && <span className="ml-1 text-xs text-primary-600">(tu hijo)</span>}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[p.estado] ?? ""}`}>
                  {ESTADO_LABEL[p.estado] ?? p.estado}
                </span>
              </div>
            );
          })}
          {(plantel ?? []).length === 0 && <div className="text-neutral-400">Sin convocados todavía.</div>}
        </div>
      </div>
    </div>
  );
}
