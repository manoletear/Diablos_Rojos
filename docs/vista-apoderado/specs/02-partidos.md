# 02 · Partidos (lista + detalle en vivo)

**Tipo:** solo lectura. Rutas ref: `/dashboard/parent/matches`, `/dashboard/parent/matches/:id/live`.

## Lista [OBS]
- Tabs: **Hoy y Próximos** (contador; ventana 14 días) · **Historial** (contador; últimos 20 completados).
- Card de partido próximo: rival, categoría • torneo, fecha, lugar, hora citación, hora partido, Local/Visita,
  estado de convocatoria ("✓ Tu hijo está convocado"), botón **Ver convocatoria** → página convocatoria del equipo (ver spec 03),
  link **Ver detalles →** (toda la card es clicable) → detalle en vivo.
- Card de historial: rival, badge "⭐ Participó" si el hijo jugó, categoría • torneo, fecha. **No muestra marcador** (gap G-09).

## Detalle / En vivo [OBS]
- Header: rival, estado (PRÓXIMAMENTE / EN VIVO [INF] / FINALIZADO), categoría • torneo, fecha-hora.
- **Marcador** + reloj y período actual (ej. "1er Tiempo").
- **Información del partido:** estado, duración por período, nº de períodos, lugar.
- **Alineación del equipo:** colapsable ("Tap para ver la alineación completa").
- **Eventos del partido** con filtros por tipo y contador: Gol, Gol recibido, Tarjeta amarilla, Tarjeta roja, Sustitución
  (con motivo, ej. "Cambio táctico"), Atajada (con tipo, ej. "Bloqueo"), Remate. Cada evento: icono, minuto, tipo, jugador (nombre + dorsal), metadata ("Con asistencia").
- Toggle de sonido 🔔 (preferencia local, para alertas en vivo).

## Datos
`matches`, `match_events`, `match_lineups`, `match_calls`, `venues`, `tournaments`, `categories`.
Tiempo real [INF]: suscripción a `match_events` y `matches.status/score` del partido abierto.

## User stories
- US-02.1 Quiero seguir el partido de mi hijo en vivo si no pude ir.
- US-02.2 Quiero ver el historial con resultado y la participación de mi hijo (minutos, goles).

## Criterios de aceptación
- [ ] Eventos llegan en tiempo real sin recargar (latencia < 5 s).
- [ ] Historial muestra marcador final y stats del hijo en ese partido.
- [ ] Filtro por hijo cuando hay más de uno.
- [ ] Si el hijo no fue convocado, la card lo dice explícitamente.
- [ ] Privacidad: los nombres de jugadores en eventos/alineación muestran solo nombre de pila + dorsal (como en referencia) — validar con la política de la academia.
