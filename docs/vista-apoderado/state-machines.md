# Máquinas de estado

Toda transición se valida en servidor: estado origen permitido + actor autorizado + deadline + ownership. Toda transición escribe `audit_log`.

## Convocatoria (match_call)
```
pendiente ──confirmar(guardian)──▶ confirmada
pendiente ──rechazar(guardian, motivo?)──▶ rechazada
confirmada ⇄ rechazada        (cambio de respuesta; solo antes de deadline) [MEJORA G-03]
pendiente ──deadline vencido (job)──▶ expirada
* ──coach desconvoca──▶ (registro eliminado / anulada)
```
Post-partido, la participación se deriva de lineup/eventos ("Jugó 32'").

## Participación en torneo
```
pendiente ──aprobar(guardian)──▶ aprobado   (+ crea payment_due si costo > 0, en transacción)
pendiente ──rechazar(guardian|coach)──▶ rechazado (decided_by_role)
pendiente ──deadline vencido──▶ expirado
aprobado ──rechazar(coach)──▶ rechazado     (anula cuota si no está pagada) [INF]
```

## Cuota (payment_due) — estado derivado de fechas + pagos
```
pendiente       = saldo > 0, hoy ≤ vencimiento, sin pagos por_comprobar
vencido         = saldo > 0, hoy > vencimiento
por_comprobar   = existe payment.estado = por_comprobar
parcial         = 0 < pagado_aprobado < monto
pagada          = pagado_aprobado ≥ monto
anulada         = cancelada por admin
```
Recomendación: calcular el estado (vista o columna generada + job diario para `vencido`), no setearlo a mano.

## Pago (payment)
```
transferencia: creado ──▶ por_comprobar ──admin aprueba──▶ aprobado
                                         └─admin rechaza(motivo)──▶ rechazado (guardian puede re-subir → nuevo payment)
tarjeta_online: iniciado ──webhook ok (firma válida, idempotente)──▶ aprobado
                         └─webhook fallo / timeout──▶ fallido
efectivo/pos: registrado por admin ──▶ aprobado
```

## Pedido de tienda (order)
Dos dimensiones independientes:
- **logística:** pendiente → pedido_proveedor → listo_retiro → entregado | cancelado
- **pago:** heredado de su payment_due (pendiente / pagada / …)

## Asistencia
```
(sin registro) ──aviso apoderado──▶ notice creado
pase de lista: presente | tarde | ausente | justificado
ausente + notice previo ⇒ justificado (automático)
```

## Partido
```
programado → en_vivo → finalizado
programado → suspendido | reprogramado (notifica a convocados)
```
