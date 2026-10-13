# 00 · Overview — rol, navegación y reglas transversales

## Rol
`guardian` (apoderado). Ve solo a sus hijos vinculados (`guardian_students`). Branding por academia (logo + nombre en header) [OBS].

## Navegación [OBS]
Sidebar agrupado (desktop) — grupos colapsables:

| Grupo | Ítem | Ruta referencia |
|---|---|---|
| — | Inicio | `/dashboard/parent` |
| DEPORTIVO | Partidos | `/dashboard/parent/matches` |
| DEPORTIVO | Torneos | `/dashboard/parent/tournaments` |
| GESTIÓN | Reporte Asistencias | `/dashboard/reports/attendances` |
| MI FAMILIA | Convocatorias | `/dashboard/my-calls` |
| MI FAMILIA | Mis Hijos | `/dashboard/parent/students` |
| MI FAMILIA | Mis Pagos | `/dashboard/parent/payments` |
| MI FAMILIA | Calendario | `/dashboard/parent/calendar` |
| MI FAMILIA | Tienda | `/dashboard/parent/catalog` |
| MI CUENTA | Configuración | `/dashboard/settings` |
| AYUDA | Centro de Ayuda | `/dashboard/help` |

Bottom nav móvil [OBS]: Inicio · Convocatorias · Mis Hijos · Pagos · Partidos · Más.
Footer sidebar: email del usuario + rol + "Cerrar sesión".

### Rutas de detalle observadas
- `/dashboard/students/:id` (perfil alumno) — nota: fuera del namespace `/parent` [OBS]
- `/dashboard/students/:id/stats` y `/dashboard/parent/students/:id/stats`
- `/dashboard/parent/matches/:id/live` (detalle/en vivo)
- `/dashboard/parent/matches/:id/convocation` (convocatoria del equipo)
- `/dashboard/parent/tournaments/:id`
- `/dashboard/parent/payments/:id` (+ `?action=pay` abre el modal de pago directo)
- `/dashboard/parent/catalog/cart`, `/dashboard/parent/catalog/orders`

**Recomendación [INF]:** agrupar todo bajo un namespace propio del rol (ej. `/familia/...`) y resolver permisos en un
único layout/middleware. Las rutas compartidas con el rol admin (reporte de asistencias, perfil de alumno) son el
origen de los gaps G-01 y G-06.

## Patrones de UI transversales [OBS]
- **Tarjetas KPI clicables** que llevan a la sección (contador + CTA).
- **Badges de estado** con color (Pendiente/Vencido/Pagado/Confirmado/Rechazado).
- **Filtro por hijo** cuando hay más de uno (pagos). [INF] Debe existir en todas las secciones con datos por hijo.
- **Modales** para detalle rápido (convocatoria, evento de calendario, agregar al carrito, registrar pago).
- Botón flotante "Ayuda".

## Reglas transversales
- R-01 Toda query del rol se acota a `students WHERE id IN (hijos del apoderado)`.
- R-02 Las acciones validan estado y deadline en servidor.
- R-03 Cada acción del apoderado deja registro (`audit_log`: quién, qué, cuándo, valor anterior/nuevo).
- R-04 Notificaciones push/email en: nueva convocatoria, cambio de horario, cuota por vencer, comprobante aprobado/rechazado [AYUDA].
- R-05 PWA instalable [AYUDA].
