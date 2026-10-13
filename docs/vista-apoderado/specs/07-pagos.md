# 07 · Mis Pagos

**Tipo:** ACCIÓN (pagar / subir comprobante). Rutas ref: `/dashboard/parent/payments`, `/:id`, `/:id?action=pay`.

## Lista [OBS]
- Banner de alerta: "Tienes N pago(s) vencido(s) · Total pendiente: $X".
- Contadores: pagados · pendientes · vencidos.
- Filtros por estado: Todos · Pendientes · Vencidos · Pagados. Filtro por hijo: "Todos los hijos".
- Card por cuota: concepto (Mensualidad <mes>, Matrícula, Rifa, Compra catálogo…), badge estado, hijo, monto, vencimiento.
  Botones: **Ver Detalle** · **Pagar** (solo impagas; abre el detalle con el modal de pago).

## Detalle de cuota [OBS]
Concepto, estado, hijo, **monto total**, **saldo pendiente**, vencimiento, notas (ej. detalle de la rifa). Botón **Pagar ahora**.

## Modal "Registrar Pago" [OBS] (abierto sin enviar)
- Resumen: estudiante, concepto, monto total, saldo pendiente.
- Aviso: transferencia o tarjeta online; efectivo/POS solo presencial con administración.
- **Monto a pagar*** con botón "Pagar todo" y máximo = saldo → **se permiten pagos parciales**.
- **Método de pago***: Transferencia | Tarjeta de Crédito/Débito (MercadoPago). El texto informativo dice "Flow" (inconsistencia G-07).
- **Fecha de pago***.
- **Comprobante de transferencia*** (si transferencia): pegar desde portapapeles (Ctrl+V) o seleccionar archivo; imagen o PDF; máx 5 MB.
- Notas (opcional, 0/1000).
- Advertencia: transferencias quedan pendientes de aprobación por admin/director.
- Botones: Cancelar · **Registrar Pago**.

## Flujo online [AYUDA]
Pagar con MercadoPago → redirección → retorno automático con la cuota pagada (sin comprobante).

## Estados [OBS]+[AYUDA]
Cuota: Pendiente · Vencido · Por comprobar · Parcial · Pagado · (Rechazado aplica al comprobante). Ver `state-machines.md`.

## User stories
- US-07.1 Quiero pagar todas las cuotas pendientes de mis hijos en una sola transacción.
- US-07.2 Quiero pagar con tarjeta y que se refleje al instante.
- US-07.3 Si transfiero, quiero copiar los datos bancarios con un toque y subir el comprobante desde el celular.
- US-07.4 Quiero descargar el comprobante/recibo de cada pago aprobado.

## Criterios de aceptación
- [ ] Datos bancarios de la academia visibles con botón copiar (no se observaron en el modal; validar).
- [ ] Pago múltiple: seleccionar N cuotas → un único checkout; el webhook distribuye el pago entre cuotas.
- [ ] La cuota pasa a `pagada` **solo** vía webhook verificado (firma) o aprobación admin. Idempotencia por `provider_payment_id`.
- [ ] Comprobante: upload a storage privado, URL firmada, validación MIME y tamaño en servidor.
- [ ] Rechazo de comprobante notifica al apoderado con motivo y permite re-subir.
- [ ] Pagos parciales recalculan saldo y dejan estado `parcial`.
- [ ] Recibo descargable por pago aprobado.
- [ ] Un solo proveedor online por academia, configurable; el copy de la UI sale de esa configuración (resuelve G-07).
