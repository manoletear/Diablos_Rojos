# 10 · Mi Cuenta y Ayuda

## Configuración [OBS]
Ruta ref `/dashboard/settings`. Solo: Información del usuario (lectura), Sesión → **Cerrar sesión**, **Información para soporte**.
No se puede editar nada (G-05).

### Objetivo
- Editar nombre, teléfono, email (con verificación), contraseña.
- Preferencias de notificación por tipo (convocatorias, pagos, cambios de horario, partido en vivo) y canal (push, email, WhatsApp [INF]).
- Gestionar dispositivos con push activo.
- Agregar segundo apoderado (invitación) para el mismo hijo.

## Centro de Ayuda [OBS]
Ruta ref `/dashboard/help`. Buscador, filtros por categoría (Apoderados, General, Pagos) y nivel. 10 artículos:
instalar PWA, confirmar/rechazar convocatoria, ver y pagar cuotas, notificaciones push, primeros pasos, FAQ,
comunicación con la academia, historial del hijo, calendario, asistencia. Cada artículo: índice, tiempo de lectura,
vistas, fecha de actualización, copiar enlace, imprimir, FAQ expandible, feedback "¿Te resultó útil?".

### Objetivo
- Contenido versionado junto al código (MDX) para que no se desalinee de la UI (hoy la ayuda describe flujos distintos a los reales: G-04, G-05).
- Ayuda contextual: link "?" en cada sección al artículo correspondiente.

## Criterios de aceptación
- [ ] Toda edición de perfil auditada; cambio de email requiere verificación.
- [ ] Preferencias de notificación respetadas por el servicio de envío.
- [ ] Cada artículo de ayuda referencia la versión de la UI que describe.
