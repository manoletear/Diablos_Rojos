# Gaps observados en la referencia + mejoras de producto

## A. Bugs / inconsistencias observadas en Telar (no repetir)

| ID | Severidad | Hallazgo | Corrección en tu producto |
|---|---|---|---|
| G-01 | **Alta (privacidad)** | La página "Convocatoria del equipo" expone nombre completo de todos los menores convocados a cualquier apoderado. | Mostrar nombre de pila + inicial + dorsal. Scoping estricto en backend. Revisar Ley 19.628 / Ley 21.719 de datos personales. |
| G-02 | Media | Modal de evento del calendario muestra valores crudos: `Tipo: home`, `Resultado: null - null`. | Capa de presentación con i18n; ocultar campos vacíos. |
| G-03 | Media | No se puede cambiar la respuesta a una convocatoria; hay que avisar por WhatsApp. | Cambio permitido hasta deadline, auditado y notificado. |
| G-04 | Media | Inconsistencia de acciones: la tabla y el modal tienen Confirmar + Rechazar; la página del equipo solo Confirmar. La ayuda describe un 4º camino (Partidos → detalle). | Un solo componente `CallResponse` reutilizado en todos los puntos de entrada. |
| G-05 | Media | El apoderado no puede editar ningún dato (Configuración es de solo lectura). La ayuda dice que el contacto del entrenador está en el perfil del hijo: no está. | Edición de contacto/salud + card de entrenador. Ayuda versionada con el código. |
| G-06 | Media | "Reporte Asistencias" es la ruta de admin reutilizada: muestra "Tu sede" y 0 registros por defecto. | Vista propia del apoderado (calendario mensual por hijo). |
| G-07 | Baja | El modal de pago dice "tarjeta (Flow)" pero el selector ofrece MercadoPago. | Copy derivado de la configuración del proveedor de la academia. |
| G-08 | Baja | Inicio no muestra torneos pendientes de aprobación (solo existe contador dentro de Torneos). | Bloque "Requiere tu acción" unificado. |
| G-09 | Baja | Historial de partidos sin marcador ni stats del hijo en la card. | Marcador + línea del hijo (minutos, goles). |
| G-10 | Baja | Calendario dice "Entrenamientos, partidos y torneos" pero solo muestra partidos. | Generar sesiones desde el horario de la categoría. |
| G-11 | Baja | Un mismo pedido figura como "Pendiente" en Mis Pedidos y "Pedido al proveedor / Pagado" en el perfil del hijo. | Dos estados separados (logístico y de pago) mostrados igual en todos lados. |
| G-12 | Baja | Rutas mezcladas (`/dashboard/students/:id` vs `/dashboard/parent/...`) → permisos dispersos. | Namespace único por rol + guard en layout. |
| G-13 | Info | Tabs de estadísticas (Gráficos, Partidos, Evaluaciones, Antropometría) no respondieron en la sesión de análisis. | Verificar en tu implementación que cada tab carga su propia data con estado vacío. |

## B. Mejoras de producto (diferenciación)

Priorizadas por impacto en la operación de la academia × esfuerzo.

| # | Mejora | Por qué importa | Esfuerzo |
|---|---|---|---|
| M-1 | **Bandeja "Requiere tu acción"** en Inicio + push con acciones (Confirmar/Rechazar desde la notificación) | Sube la tasa de respuesta de convocatorias; el entrenador planifica con datos reales | M |
| M-2 | **Avisar inasistencia** a entrenamiento desde la app | Elimina el WhatsApp al entrenador; la asistencia queda justificada automáticamente | S |
| M-3 | **Pago múltiple** (todas las cuotas de todos los hijos en un checkout) | Menos fricción, menos morosidad | M |
| M-4 | **Pago automático / suscripción** de mensualidad (PAT con tarjeta) | Ataca la causa raíz de la morosidad | L |
| M-5 | Motivo de rechazo de convocatoria + cambio de respuesta | Información para el entrenador; menos no-shows | S |
| M-6 | **Feed ICS** del calendario | El apoderado vive en su calendario, no en tu app | S |
| M-7 | Edición de datos de contacto, emergencia y ficha de salud | Hoy está desactualizado y lo corrige el admin a mano | S |
| M-8 | Segundo apoderado por invitación (padre y madre, cada uno con su login y permisos) | Familias separadas, permisos de pago/respuesta distintos | M |
| M-9 | Coordinación de transporte (quién va y quién puede llevar) en la convocatoria | Valor social real, retención | M |
| M-10 | Informe PDF de temporada / evolución (evaluaciones + antropometría + stats) | Percepción de valor de la mensualidad | M |
| M-11 | Recibo descargable por pago | Rendición de gastos, confianza | S |

## C. Implicancia sistémica
El portal del apoderado no es una vista: es la **interfaz de cobranza y de planificación deportiva** de la academia.
Cada acción que hoy se hace por WhatsApp (avisar inasistencia, cambiar respuesta, mandar comprobante) es trabajo
manual del entrenador/administración y dato que no entra al sistema. El diseño tiene que optimizar dos métricas:
**tasa de respuesta a convocatorias a tiempo** y **días promedio de pago**. Instrumentar ambas desde el día 1.
