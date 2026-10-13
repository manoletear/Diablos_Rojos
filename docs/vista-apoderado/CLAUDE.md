# Módulo Apoderado — contexto para Claude Code

## Qué es
Portal para apoderados (padres/tutores) de una academia deportiva. Un apoderado tiene 1..N hijos (alumnos),
cada alumno pertenece a 1..N categorías (ej. Sub10, Sub13) en una o más sedes. El apoderado **consume**
información (partidos, estadísticas, asistencia, pagos) y ejecuta un set acotado de **acciones**:

1. Responder convocatorias (confirmar / rechazar).
2. Aprobar o rechazar participación en torneos con costo.
3. Pagar cuotas (online o transferencia con comprobante; pagos parciales permitidos).
4. Comprar en la tienda (carrito → pedido → genera cuota).
5. Exportar (calendario, CSV de asistencia, PDF de estadísticas).
6. (Mejora, no existe en referencia) Avisar inasistencia, editar datos de contacto, cambiar respuesta a convocatoria.

## Reglas de trabajo
- **Antes de escribir código:** inspecciona el repo (stack, ORM, auth, estructura de rutas, componentes UI existentes,
  modelo de datos actual) y entrega un plan con fases, archivos a tocar y decisiones pendientes. Espera aprobación.
- **Reutiliza** el modelo de datos existente. `schema.sql` es referencia: mapea entidades a tablas existentes antes de crear nuevas.
  Nunca dupliques una entidad que ya existe con otro nombre.
- **Seguridad por datos, no por UI:** todo acceso del rol apoderado se filtra en backend por `guardian_id → students`.
  Un apoderado nunca puede leer datos personales de alumnos que no son sus hijos (ver gap G-01 en `gaps-y-mejoras.md`).
- **Las acciones son transiciones de estado** definidas en `state-machines.md`. Implementa la validación de la transición
  en servidor (estado actual permitido, deadline, ownership), no solo deshabilitando botones.
- **Dinero:** montos en enteros (CLP sin decimales). Saldo pendiente = monto − suma de pagos aprobados. Nunca marcar
  una cuota como pagada desde el cliente: lo hace el webhook de la pasarela o la aprobación del admin.
- **Mobile-first.** La mayoría de los apoderados entra desde el celular (PWA + push). Bottom nav en móvil.
- **Español de Chile** en toda la UI. Nada de valores crudos en pantalla (`home`, `null - null`: ver gaps).
- Fechas en zona `America/Santiago`.
- Cada sección se construye con su spec en `specs/` y se cierra cuando cumple sus criterios de aceptación.

## Orden sugerido
Overview/layout → Mis Hijos (perfil) → Convocatorias → Pagos → Partidos (lista + en vivo) → Inicio (agrega todo lo anterior)
→ Calendario → Torneos → Asistencias → Tienda → Cuenta/Ayuda.
Inicio va después porque es un agregador de las demás secciones.
