import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  actualizarPartido,
  toggleConvocado,
  guardarLineup,
  setTitular,
  iniciarEnVivo,
  finalizarEnVivo,
  sumarGol,
  guardarEstadisticaJugador,
} from "../actions";

export default async function DetallePartidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: partido } = await supabase
    .from("partidos")
    .select("*, categorias(id, nombre), recintos(nombre)")
    .eq("id", id)
    .single();
  if (!partido) notFound();

  const categoria = partido.categorias as unknown as { id: string; nombre: string };

  const [
    { data: alumnosCategoria },
    { data: convocatoria },
    { data: lineup },
    { data: estadoVivo },
    { data: minutajes },
  ] = await Promise.all([
    supabase.from("alumnos").select("id, nombre, apellido").eq("categoria_id", categoria.id).eq("estado", "matriculado").order("apellido"),
    supabase.from("convocatorias").select("id, convocatoria_jugadores(alumno_id, estado)").eq("partido_id", id).maybeSingle(),
    supabase.from("lineups").select("*").eq("partido_id", id).maybeSingle(),
    supabase.from("partido_estado_vivo").select("*").eq("partido_id", id).maybeSingle(),
    supabase.from("minutajes_partido").select("*").eq("partido_id", id),
  ]);

  const convocadosIds = new Set(
    ((convocatoria?.convocatoria_jugadores as { alumno_id: string; estado: string }[] | undefined) ?? [])
      .filter((c) => c.estado !== "rechazada")
      .map((c) => c.alumno_id)
  );
  const minutajePorAlumno = new Map((minutajes ?? []).map((m) => [m.alumno_id, m]));
  const fecha = new Date(partido.fecha_hora);

  const actualizarConId = actualizarPartido.bind(null, id);
  const lineupConId = guardarLineup.bind(null, id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">{categoria.nombre} vs {partido.rival}</h1>
      <p className="text-sm text-neutral-500">
        {fecha.toLocaleDateString("es-CL")} {fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} · {(partido.recintos as { nombre: string } | null)?.nombre ?? "Sin recinto"}
      </p>

      {/* Editar */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="font-semibold text-neutral-900">Editar Partido</div>
        <form action={actualizarConId} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600">Rival</label>
            <input name="rival" defaultValue={partido.rival} className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Fecha</label>
            <input type="date" name="fecha" defaultValue={partido.fecha_hora.slice(0, 10)} className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Hora</label>
            <input type="time" name="hora" defaultValue={fecha.toTimeString().slice(0, 5)} className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Condición</label>
            <select name="local_o_visita" defaultValue={partido.local_o_visita} className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm">
              <option value="local">Local</option>
              <option value="visita">Visita</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Estado</label>
            <select name="estado" defaultValue={partido.estado} className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm">
              <option value="programado">Programado</option>
              <option value="en_curso">En curso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Resultado</label>
            <div className="mt-1 flex items-center gap-1">
              <input type="number" name="resultado_local" defaultValue={partido.resultado_local ?? ""} className="w-16 rounded-md border border-neutral-300 px-2 py-2 text-sm" />
              <span>-</span>
              <input type="number" name="resultado_rival" defaultValue={partido.resultado_rival ?? ""} className="w-16 rounded-md border border-neutral-300 px-2 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
            Guardar
          </button>
        </form>
      </div>

      {/* En Vivo */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-neutral-900">En Vivo</div>
          <span className="text-2xl font-bold text-neutral-900">{partido.resultado_local ?? 0} - {partido.resultado_rival ?? 0}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!estadoVivo || estadoVivo.estado === "no_iniciado" ? (
            <form action={iniciarEnVivo.bind(null, id)}>
              <button type="submit" className="rounded-md bg-error px-4 py-2 text-sm font-medium text-white">▶ Iniciar partido</button>
            </form>
          ) : estadoVivo.estado !== "finalizado" ? (
            <>
              <form action={sumarGol.bind(null, id, "local")}>
                <button type="submit" className="rounded-md bg-dr-neutral-900 px-4 py-2 text-sm font-medium text-white">⚽ Gol local</button>
              </form>
              <form action={sumarGol.bind(null, id, "rival")}>
                <button type="submit" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700">⚽ Gol rival</button>
              </form>
              <form action={finalizarEnVivo.bind(null, id)}>
                <button type="submit" className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white">■ Finalizar</button>
              </form>
              <span className="self-center rounded-full bg-warning-bg px-3 py-1 text-xs font-medium text-warning">Estado: {estadoVivo.estado}</span>
            </>
          ) : (
            <span className="rounded-full bg-success-bg px-3 py-1 text-xs font-medium text-success">Partido finalizado</span>
          )}
        </div>
      </div>

      {/* Convocatoria + Lineup */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="font-semibold text-neutral-900">Convocatoria y Lineup — {categoria.nombre}</div>
        <form action={lineupConId} className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-600">Formación</label>
            <input name="formacion" defaultValue={lineup?.formacion ?? ""} placeholder="4-3-3" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-dr-neutral-900 px-4 py-2 text-sm font-medium text-white">Guardar formación</button>
        </form>

        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Alumno</th>
                <th className="px-3 py-2">Convocado</th>
                <th className="px-3 py-2">Titular</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {alumnosCategoria?.map((a) => {
                const convocado = convocadosIds.has(a.id);
                const m = minutajePorAlumno.get(a.id);
                return (
                  <tr key={a.id}>
                    <td className="px-3 py-2">{a.nombre} {a.apellido}</td>
                    <td className="px-3 py-2">
                      <form action={toggleConvocado.bind(null, id, a.id, !convocado)}>
                        <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium ${convocado ? "bg-success-bg text-success" : "bg-neutral-100 text-neutral-500"}`}>
                          {convocado ? "✓ Convocado" : "Convocar"}
                        </button>
                      </form>
                    </td>
                    <td className="px-3 py-2">
                      {convocado && (
                        <form action={setTitular.bind(null, id, a.id, !m?.titular)}>
                          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium ${m?.titular ? "bg-info-bg text-info" : "bg-neutral-100 text-neutral-500"}`}>
                            {m?.titular ? "Titular" : "Suplente"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estadisticas */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="font-semibold text-neutral-900">Estadísticas por jugador</div>
        <div className="mt-3 space-y-2">
          {alumnosCategoria?.filter((a) => convocadosIds.has(a.id)).map((a) => {
            const m = minutajePorAlumno.get(a.id);
            const guardarConId = guardarEstadisticaJugador.bind(null, id, a.id);
            return (
              <form key={a.id} action={guardarConId} className="flex flex-wrap items-end gap-2 rounded-md bg-neutral-50 p-3">
                <div className="min-w-[140px] flex-1 text-sm font-medium text-neutral-900">{a.nombre} {a.apellido}</div>
                <div>
                  <label className="block text-xs text-neutral-500">Min.</label>
                  <input type="number" name="minutos_jugados" defaultValue={m?.minutos_jugados ?? 0} className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500">Goles</label>
                  <input type="number" name="goles" defaultValue={m?.goles ?? 0} className="w-14 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500">Asist.</label>
                  <input type="number" name="asistencias" defaultValue={m?.asistencias ?? 0} className="w-14 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500">🟨</label>
                  <input type="number" name="amarillas" defaultValue={m?.amarillas ?? 0} className="w-12 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500">🟥</label>
                  <input type="number" name="rojas" defaultValue={m?.rojas ?? 0} className="w-12 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                </div>
                <button type="submit" className="rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white">Guardar</button>
              </form>
            );
          })}
          {alumnosCategoria?.filter((a) => convocadosIds.has(a.id)).length === 0 && (
            <div className="text-sm text-neutral-400">Convoca jugadores arriba para registrar sus estadísticas.</div>
          )}
        </div>
      </div>
    </div>
  );
}
