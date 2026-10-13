# 04 · Torneos

**Tipo:** lectura + ACCIÓN (aprobar participación con costo). Rutas ref: `/dashboard/parent/tournaments`, `/:id`.

## Lista [OBS]
- Contadores: **Total Torneos** (donde tus hijos están registrados) · **Pendientes** (requieren tu aprobación) · **Aprobados**.
- Tabla: Torneo (nombre, costo adicional, badge "Requiere aprobación") · Tipo (Corto Plazo / Anual / Un Día) · Fechas inicio-fin ·
  Mis Hijos · Estado · Fecha Límite (con badge "Vencida") · Acciones (**Ver**).

## Detalle [OBS]
- Nombre, tipo, badge "Requiere aprobación", descripción, fechas, sede, costo adicional,
  fecha límite de aprobación (+ "Vencida"), categorías participantes.
- **Participación de mis hijos** — por hijo: estado (Pendiente / Aprobado / Rechazado), fecha de la decisión,
  notas (ej. "Rechazado por entrenador"). Los botones Aprobar/Rechazar del apoderado no fueron visibles (torneo vencido) [INF: existen cuando está vigente].

## Reglas [INF]
- Solo torneos con `requires_guardian_approval = true` piden acción.
- Aprobar genera una cuota (`payment_due`) por el costo adicional, si costo > 0.
- Tanto apoderado como entrenador pueden rechazar; se registra quién (`decided_by_role`).
- Después del deadline la decisión se bloquea; sin respuesta → estado `expirado`.

## User stories
- US-04.1 Quiero saber qué torneos requieren mi aprobación, cuánto cuestan y hasta cuándo puedo decidir.
- US-04.2 Al aprobar quiero ver el cargo que se generará y poder pagarlo de inmediato.

## Criterios de aceptación
- [ ] Botones Aprobar/Rechazar visibles solo con estado pendiente y deadline vigente.
- [ ] Aprobar muestra resumen de costo y crea la cuota de forma atómica (transacción).
- [ ] Recordatorio push 48 h y 24 h antes del deadline si sigue pendiente.
- [ ] Torneos pendientes aparecen en el bloque "Requiere tu acción" de Inicio.
