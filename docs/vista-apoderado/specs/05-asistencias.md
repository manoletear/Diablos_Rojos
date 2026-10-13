# 05 · Asistencias

**Tipo:** solo lectura (+ export). Ruta ref: `/dashboard/reports/attendances` (ruta compartida con admin).

## Observado [OBS]
- Subtítulo "Tu sede".
- KPIs: Total asistencias · Tasa de asistencia (presentes+tarde / total) · Presentes · Ausencias (desglose tarde, justificados).
- Filtros: rango de fechas (2 date inputs), Buscar, "Más filtros" → Categoría, Alumno, y dos selectores "Todos" (estado / tipo [INF]), Limpiar filtros.
- Tabla "Registros (n)" con Agrupar y export **CSV**.
- **Por defecto muestra 0 registros** aunque los hijos tienen asistencia → reporte de admin reutilizado sin scoping de apoderado (G-06).
- En el perfil del hijo sí aparece "Historial de Asistencias" (fecha · categoría · estado) y % asistencia.

## Diseño objetivo [AYUDA]+[INF]
Vista propia del apoderado, por hijo:
- **Calendario mensual** coloreado: Verde = Presente, Rojo = Ausente, Amarillo = Justificado, (Naranjo = Tarde).
- Detalle del día al tocar.
- Navegación entre meses; resumen del mes (% asistencia).
- Selector de hijo.

## User stories
- US-05.1 Quiero ver la asistencia mensual de mi hijo de un vistazo.
- US-05.2 **(Nuevo)** Quiero avisar con anticipación que mi hijo no irá a un entrenamiento, para que quede justificado.
- US-05.3 Quiero reportar un error en un registro de asistencia.

## Criterios de aceptación
- [ ] Al entrar, muestra el mes actual del primer hijo con datos (nunca 0 por falta de filtro).
- [ ] **Avisar inasistencia:** seleccionar sesión futura + motivo → crea `attendance_notice`; el entrenador lo ve al pasar lista y la marca queda `justificado` automáticamente.
- [ ] Export CSV acotado a hijos propios.
- [ ] Tasa de asistencia calculada igual en Inicio, Mis Hijos y aquí (una sola función).
