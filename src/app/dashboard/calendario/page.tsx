import { createClient } from "@/lib/supabase/server";
import { CalendarView, type CalEvent } from "@/components/calendar-view";

const COLOR_INFO = "#2251A3"; // partido

export default async function CalendarioPage() {
  const supabase = await createClient();

  const [{ data: partidos }, { data: torneos }] = await Promise.all([
    supabase.from("partidos").select("id, fecha_hora, rival, categorias(nombre)").order("fecha_hora"),
    supabase
      .from("torneos")
      .select("id, nombre, fecha_inicio, fecha_fin")
      .not("fecha_inicio", "is", null)
      .order("fecha_inicio", { ascending: false }),
  ]);

  // Los torneos (ANFP Iniciación, etc.) duran meses enteros — como barra de
  // calendario tapaban los partidos reales día a día. Se muestran aparte,
  // como lista de contexto, y el calendario solo marca partidos concretos.
  const events: CalEvent[] = (partidos ?? []).map((p) => {
    const cat = (p.categorias as unknown as { nombre: string } | null)?.nombre ?? "";
    return {
      id: `partido-${p.id}`,
      title: `${cat} vs ${p.rival}`,
      start: p.fecha_hora,
      color: COLOR_INFO,
    };
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Calendario</h1>
      <p className="text-sm text-neutral-500">Vista unificada de partidos (vista administración — se ve todo el club)</p>

      {torneos && torneos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {torneos.map((t) => (
            <span key={t.id} className="rounded-full bg-warning-bg px-3 py-1 text-xs font-medium text-warning">
              🏆 {t.nombre} · {t.fecha_inicio} – {t.fecha_fin ?? "?"}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6">
        <CalendarView events={events} />
      </div>
    </div>
  );
}
