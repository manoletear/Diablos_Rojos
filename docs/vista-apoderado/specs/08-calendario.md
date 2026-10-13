# 08 · Calendario

**Tipo:** lectura (+ export). Ruta ref: `/dashboard/parent/calendar`.

## Observado [OBS]
- Subtítulo: "Entrenamientos, partidos y torneos de tus hijos".
- Controles: navegación (‹ ›), **Hoy**, vistas **Mes / Semana / Día**, **Filtros**, **Exportar**.
- Leyenda de tipos: Entrenamiento · Partido · Torneo.
- Eventos en celda: icono + categoría + rival.
- Modal de evento (partido): título, tipo, fecha, hora inicio-fin, categoría, rival, lugar, tipo local/visita, resultado, torneo.
  Bugs: muestra `Tipo: home` y `Resultado: null - null` (G-02).
- En el mes observado **solo aparecen partidos**, no entrenamientos, pese al subtítulo (G-10).

## User stories
- US-08.1 Quiero ver en un solo calendario entrenamientos, partidos y torneos de todos mis hijos, diferenciados por color/hijo.
- US-08.2 Quiero suscribir el calendario a Google/Apple Calendar (ICS) y que se actualice solo.

## Criterios de aceptación
- [ ] Entrenamientos recurrentes (desde horario de la categoría) + excepciones (suspensiones) se muestran.
- [ ] Filtro por hijo y por tipo; color por hijo.
- [ ] Modal sin valores crudos: "Local/Visita", resultado solo si el partido terminó.
- [ ] Modal con CTA contextual: si hay convocatoria pendiente → Confirmar/Rechazar; si es partido → "Ver en vivo".
- [ ] **Export:** feed ICS por apoderado con token revocable (no un archivo estático).
