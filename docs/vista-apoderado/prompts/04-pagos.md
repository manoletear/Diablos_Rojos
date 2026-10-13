# Fase 4 · Pagos

Spec: `specs/07-pagos.md`, `state-machines.md#cuota` y `#pago`.
1. Lista + detalle de cuotas con filtros por estado e hijo; banner de vencidas.
2. Flujo transferencia: datos bancarios con copiar, upload de comprobante (pegar o archivo, imagen/PDF ≤ 5 MB, validado en servidor, storage privado), pago parcial, estado por_comprobar.
3. Flujo online: integración con el proveedor configurado en la academia (pregúntame cuál: MercadoPago / Flow / Webpay). Webhook con verificación de firma e idempotencia por `provider_payment_id`. La cuota pasa a pagada SOLO vía webhook.
4. Pago múltiple (M-3) con `payment_allocation`.
5. Recibo descargable (M-11).
NO marcar nada como pagado desde el cliente. Plan primero; esta fase toca dinero, quiero ver el diseño del webhook antes del código.
