# 01 · Inicio (dashboard apoderado)

**Tipo:** solo lectura (agregador). Ruta ref: `/dashboard/parent`.

## Bloques [OBS]
1. **Encabezado:** "Bienvenido al portal de apoderados · Sigue el progreso de tus hijos en tiempo real".
2. **4 tarjetas KPI** (clicables):
   | Tarjeta | Valor | Destino | Nota |
   |---|---|---|---|
   | Mis Hijos | nº hijos activos | Mis Hijos | |
   | Pagos Pendientes | nº cuotas pendientes+vencidas | Mis Pagos | badge "Urgente" si hay vencidas |
   | Próximos Partidos | nº partidos próximos | Calendario | |
   | Convocatorias | nº convocatorias por responder | Convocatorias | |
3. **Estadísticas de la temporada** — una card por hijo: partidos jugados, goles, asistencias, amarillas, rojas, atajadas, minutos. CTA "Ver Estadísticas Completas".
4. **Próximos partidos** — rival, badge "⭐ Convocado", categoría • torneo, fecha/hora. CTA "Ver Todos".
5. **Últimos partidos** — por hijo: rival, fecha, titular sí/no, goles, asistencias, amarillas, minutos.
6. **Accesos rápidos:** Partidos, Torneos, Asistencias.

## Datos
Agregaciones sobre: `students`, `payments_due`, `matches`, `match_calls`, `match_player_stats`.

## User stories
- US-01.1 Como apoderado quiero ver de un vistazo qué requiere mi acción (convocatorias por responder, cuotas vencidas, torneos por aprobar).
- US-01.2 Como apoderado con varios hijos quiero ver el resumen de cada uno sin cambiar de pantalla.

## Criterios de aceptación
- [ ] Los contadores coinciden con las listas destino (mismo filtro, misma fuente).
- [ ] Badge "Urgente" solo si existe ≥1 cuota vencida.
- [ ] **Mejora:** bloque "Requiere tu acción" arriba de todo, que liste ítems accionables (convocatoria, torneo con deadline, cuota vencida) con CTA directo. Hoy la tarjeta de torneos por aprobar no existe en Inicio (gap G-08).
- [ ] Estado vacío por bloque (sin partidos, sin estadísticas).
- [ ] Carga < 1,5 s en 4G: una query agregada o endpoints paralelos, no N+1 por hijo.
