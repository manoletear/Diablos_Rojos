# Fase 3 · Acciones deportivas: Convocatorias + Torneos

Specs: `specs/03-convocatorias.md`, `specs/04-torneos.md`, `state-machines.md`.
1. Endpoint/acción de servidor `respondCall(callId, status, reason?)` con validación de estado, deadline, ownership y permiso `can_respond`. Auditado. Notifica al entrenador.
2. Componente único `CallResponse` usado en tabla, modal y página del equipo (resuelve G-04). Rechazo con motivo opcional. Cambio de respuesta hasta deadline (G-03).
3. Página del equipo con privacidad (nombre de pila + inicial + dorsal) (G-01).
4. Torneos: lista, detalle, `decideParticipation()` que crea la cuota en la misma transacción si hay costo.
5. Job que expira convocatorias y participaciones vencidas.
Tests de cada transición válida e inválida. Plan primero.
