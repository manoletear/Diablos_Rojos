# 03 · Convocatorias

**Tipo:** ACCIÓN. Rutas ref: `/dashboard/my-calls`, `/dashboard/parent/matches/:id/convocation`.

## Lista "Mis Convocatorias" [OBS]
- 3 contadores: **Confirmadas** (Vas a asistir) · **Por Responder** (Pendientes) · **Rechazadas** (No asistes).
- Tabla ordenable: Estudiante · Partido · Categoría · Citación (fecha-hora citación + hora partido) · Ubicación · Estado · Acciones.
- Acciones por fila: **Ver Detalle** (modal) · **Confirmar** · **Rechazar**.

## Modal "Detalle de Convocatoria" [OBS]
Campos: estudiante, partido, categoría, citación, hora de partido, ubicación, estado.
Botones: **Rechazar** · **Confirmar Asistencia** · **Ver convocatoria del equipo**.

## Página "Convocatoria del equipo" [OBS]
- Fecha, hora de citación, hora del partido.
- Banner del estado propio: "Aún no has confirmado tu asistencia" + **Confirmar asistencia** (aquí NO aparece Rechazar — inconsistencia G-04).
- Contadores del plantel: Confirmados / Pendientes / Rechazados.
- Lista del plantel convocado: dorsal, nombre completo, estado; el hijo propio marcado "Tu hijo".

## Reglas [AYUDA]+[INF]
- Responder dentro de 24 h recomendado. Tras responder, en la referencia **no se puede cambiar** (hay que avisar al entrenador por fuera) → gap G-03.
- Deadline de respuesta [INF]: hasta la hora de citación. Después, la convocatoria queda bloqueada.
- El entrenador ve la respuesta en tiempo real.

## User stories
- US-03.1 Quiero confirmar o rechazar con un toque desde la notificación push.
- US-03.2 Si rechazo, quiero indicar el motivo (opcional) para que el entrenador lo sepa.
- US-03.3 Quiero cambiar mi respuesta hasta X horas antes de la citación.
- US-03.4 Quiero ver quiénes más van (para coordinar transporte), sin exponer datos personales.

## Criterios de aceptación
- [ ] Confirmar/Rechazar disponible y consistente en los 3 puntos de entrada (tabla, modal, página del equipo).
- [ ] Rechazar abre un paso de confirmación con motivo opcional (catálogo: familiar, escolar, salud, otro + texto).
- [ ] Cambio de respuesta permitido hasta `call_deadline` (configurable por academia); queda auditado y notifica al entrenador.
- [ ] Transición validada en servidor (estado + deadline + ownership). Ver `state-machines.md#convocatoria`.
- [ ] Deep link desde push abre directo el modal de la convocatoria.
- [ ] Lista del plantel: nombre de pila + inicial de apellido + dorsal (G-01).
