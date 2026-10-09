"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

export type CalEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color: string;
};

export function CalendarView({ events }: { events: CalEvent[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        locale="es"
        buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
        height="auto"
        events={events}
        dayMaxEvents={3}
      />
      <div className="mt-3 flex gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-info" /> Partido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Torneo
        </span>
      </div>
    </div>
  );
}
