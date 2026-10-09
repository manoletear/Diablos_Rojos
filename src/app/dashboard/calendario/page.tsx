import { createClient } from "@/lib/supabase/server";
import { CalendarView, type CalEvent } from "@/components/calendar-view";

const COLOR_INFO = "#2251A3"; // partido
const COLOR_WARNING = "#B8780B"; // torneo

export default async function CalendarioPage() {
  const supabase = await createClient();

  const [{ data: partidos }, { data: torneos }] = await Promise.all([
    supabase.from("partidos").select("id, fecha_hora, rival, categorias(nombre)").order("fecha_hora"),
    supabase.from("torneos").select("id, nombre, fecha_inicio, fecha_fin").not("fecha_inicio", "is", null),
  ]);

  const events: CalEvent[] = [];

  for (const p of partidos ?? []) {
    const cat = (p.categorias as unknown as { nombre: string } | null)?.nombre ?? "";
    events.push({
      id: `partido-${p.id}`,
      title: `${cat} vs ${p.rival}`,
      start: p.fecha_hora,
      color: COLOR_INFO,
    });
  }

  for (const t of torneos ?? []) {
    events.push({
      id: `torneo-${t.id}`,
      title: `🏆 ${t.nombre}`,
      start: t.fecha_inicio!,
      end: t.fecha_fin ?? t.fecha_inicio!,
      allDay: true,
      color: COLOR_WARNING,
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Calendario</h1>
      <p className="text-sm text-neutral-500">Vista unificada de partidos y torneos (vista administración — se ve todo el club)</p>

      <div className="mt-6">
        <CalendarView events={events} />
      </div>
    </div>
  );
}
