# Modelo de datos derivado [INF]

Derivado de lo que la vista apoderado muestra. **Mapear contra el modelo existente del repo antes de crear tablas.**

## Núcleo organizacional
- **academy** (tenant) — nombre, logo, configuración (proveedor de pago, datos bancarios, deadlines por defecto).
- **venue / sede** — academia, nombre, código (ej. PRINCIPAL).
- **category** — academia, nombre (Sub10), año de nacimiento (2016), sede, horario de entrenamiento.
- **staff / coach** — usuario, categorías que dirige, canal de contacto.

## Personas
- **user** — auth; rol(es): admin, director, coach, guardian.
- **guardian** — user_id, teléfono, email, preferencias de notificación.
- **student** — nombre, fecha de nacimiento, género, dorsal, posición preferida, estado (matriculado/activo/inactivo), ficha de salud [nuevo].
- **guardian_student** (N:M) — relación (padre, madre, tutor), es_principal, puede_pagar, puede_responder.
- **enrollment** — student, sede, categoría(s), desde/hasta, beca %, descuento hermano (auto/manual), estado. (Multi-sede.)

## Deportivo
- **tournament** — nombre, tipo (un_dia, corto_plazo, anual), fechas, sede, costo_adicional, requires_guardian_approval, approval_deadline, descripción.
- **tournament_category** (N:M).
- **tournament_participation** — tournament, student, estado (pendiente/aprobado/rechazado/expirado), decided_by, decided_by_role, decided_at, notas.
- **match** — torneo, categoría, rival, sede/lugar, local/visita, citación_at, inicio_at, períodos, duración_período, estado (programado/en_vivo/finalizado/suspendido), marcador_local, marcador_rival.
- **match_call (convocatoria)** — match, student, estado (pendiente/confirmada/rechazada/expirada), motivo_rechazo, responded_by, responded_at, deadline.
- **match_lineup** — match, student, titular, posición.
- **match_event** — match, minuto, período, tipo (gol, gol_recibido, amarilla, roja, sustitución, atajada, remate, falta), student, student_rel (asistidor / entra-sale), metadata jsonb (tipo atajada, motivo cambio, con_asistencia).
- **match_player_stats** (vista materializada o calculada) — goles, asistencias, minutos, tiros, tiros al arco, faltas, tarjetas, atajadas.
- **evaluation** — student, fecha, coach, criterios técnicos (tab Evaluaciones). [contenido no verificado]
- **anthropometry** — student, fecha, talla, peso, etc. (tab Antropometría). [contenido no verificado]

## Asistencia
- **training_session** — categoría, fecha, inicio/fin, estado (programada/suspendida).
- **attendance** — session, student, estado (presente/tarde/ausente/justificado), registrado_por.
- **attendance_notice** [nuevo] — student, session, motivo, creado_por (guardian), creado_at.

## Finanzas
- **payment_due (cuota)** — student, concepto, tipo (mensualidad, matrícula, rifa, torneo, catálogo, otro), monto, vencimiento, estado, notas, origen (order_id / tournament_participation_id).
- **payment** — payment_due(s), monto, método (transferencia, tarjeta_online, efectivo, pos), fecha_pago, comprobante_url, estado (por_comprobar/aprobado/rechazado), motivo_rechazo, provider, provider_payment_id, registrado_por, aprobado_por.
- **payment_allocation** — payment ↔ payment_due (un pago cubre N cuotas; permite parciales).
- **credit_movement (saldo a favor)** — student/guardian, monto (+/−), origen.

## Tienda
- **product** — familia, nombre variante, precio, activo.
- **product_variant / stock** — producto, talla, stock_local.
- **cart_item** — guardian, variant, student, cantidad.
- **order** — guardian, student, estado_logístico (pendiente/pedido_proveedor/listo_retiro/entregado/cancelado), payment_due_id, nº corto.
- **order_item** — order, variant, cantidad, precio_unitario.

## Transversal
- **notification** — user, tipo, payload, leída, canal.
- **push_subscription** — user, endpoint, keys, device.
- **audit_log** — actor, entidad, entidad_id, acción, before, after, at.

## Relaciones clave
```
guardian ─< guardian_student >─ student ─< enrollment >─ category ─< match ─< match_call
student ─< payment_due >─< payment_allocation >─ payment
student ─< tournament_participation >─ tournament
order ─ payment_due (1:1)
```
