# 09 · Tienda (indumentaria)

**Tipo:** ACCIÓN (compra). Rutas ref: `/dashboard/parent/catalog`, `/cart`, `/orders`.

## Catálogo [OBS]
- Título "Tienda de Indumentaria · Compra uniformes y equipamiento". Botones **Mis Pedidos**, **Carrito**. Buscador "Buscar producto...".
- Productos agrupados por familia (Buzo, Entrenamiento, Polerón, Primera Capa…), cada variante con precio y stock disponible.

## Modal "Agregar al carrito" [OBS] (sin agregar)
- Familia + variante, origen de stock ("Stock local").
- **Talla*** (botones con stock por talla, tallas infantiles y adulto).
- **¿Para quién es?*** selector de hijo.
- Cantidad (− / +). Botones Cancelar · **Agregar**.

## Carrito [OBS]
Estado vacío "Tu carrito está vacío · Ir a la tienda". Checkout no verificado.

## Mis Pedidos [OBS]
Card por pedido: fecha, estado (Pendiente), ítems (cantidad × producto (talla)), para quién, montos.
En el perfil del hijo el mismo pedido aparece con estado logístico ("Pedido al proveedor") + estado de pago ("Pagado"),
y en Pagos como cuota "Compra catálogo: …" → **el pedido genera una cuota** [INF].

## User stories
- US-09.1 Quiero comprar el uniforme eligiendo talla y para qué hijo, y pagarlo con el mismo flujo de cuotas.
- US-09.2 Quiero saber en qué estado está mi pedido y cuándo lo retiro.

## Criterios de aceptación
- [ ] Separar estado de pago y estado logístico (dos campos), mostrados juntos y consistentes en Pedidos y Perfil (G-11).
- [ ] Stock reservado al confirmar pedido; liberado si la cuota no se paga en N días (configurable).
- [ ] Confirmar pedido crea `order` + `payment_due` en una transacción y ofrece pagar de inmediato.
- [ ] Notificación cuando el pedido está "Listo para retiro".
- [ ] Guía de tallas por producto.
