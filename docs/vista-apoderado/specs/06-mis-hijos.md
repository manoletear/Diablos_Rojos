# 06 · Mis Hijos (lista, perfil, estadísticas)

**Tipo:** lectura (hoy). Rutas ref: `/dashboard/parent/students`, `/dashboard/students/:id`, `/dashboard/students/:id/stats`.

## Lista [OBS]
Card por hijo: nombre, edad, categoría, estado (Activo), % asistencia, nº pagos pendientes + monto, goles, partidos.
Botones: **Ver Estadísticas** · **Ver Perfil**.

## Perfil del alumno [OBS]
- Header + Volver + Ver Estadísticas.
- KPIs: Asistencia (% y x/y), Pendiente por pagar ($), Partidos (nº convocatorias).
- Mini-resumen estadístico + "Ver Estadísticas Completas".
- **Información personal:** edad, fecha de nacimiento, género, estado de matrícula.
- **Información deportiva:** categorías, número de camiseta, posición preferida.
- **Apoderados:** nombre, relación, teléfono, email (relación vacía "-" en referencia).
- **Historial de asistencias:** fecha · categoría · estado (últimos 10).
- **Historial de pagos:** concepto · monto · vencimiento · estado · acciones (+ Ver todos). Incluye compras de tienda como cuotas.
- **Saldo a favor:** monto + movimientos de crédito.
- **Convocatorias a partidos:** fecha · rival · ubicación · participación ("Confirmada", "Jugó 32'").
- **Órdenes de catálogo:** fecha, nº orden, estado logístico ("Pedido al proveedor"), estado de pago ("Pagado"), ítems.
- **Matrículas multi-sede:** sede, código, desde, beca (%), descuento por hermano (Automático, según reglas), estado.
- No aparece el contacto del entrenador, aunque la ayuda dice que está aquí (G-05).

## Estadísticas completas [OBS]
- Header: nombre, dorsal • posición. **Exportar PDF**.
- Filtros: Categoría, Torneo.
- Tabs: **Resumen** · Gráficos · Partidos · Evaluaciones · Antropometría (contenido de las 4 últimas no verificado).
- Resumen: partidos jugados (n como titular), goles (por partido), asistencias (por partido), minutos (promedio);
  Ofensivas: tiros totales, tiros al arco, precisión %; Disciplina: amarillas, rojas, faltas cometidas, faltas recibidas.

## User stories
- US-06.1 Quiero ver la ficha completa de mi hijo y su evolución deportiva.
- US-06.2 **(Nuevo)** Quiero actualizar mis datos de contacto y los de contacto de emergencia / salud (alergias, previsión).
- US-06.3 Quiero saber cómo contactar al entrenador de cada categoría.
- US-06.4 Quiero descargar un informe PDF de temporada.

## Criterios de aceptación
- [ ] El perfil se sirve desde ruta del rol apoderado con scoping estricto (solo hijos propios).
- [ ] Datos editables por el apoderado: teléfono, email, relación, contacto de emergencia, ficha de salud. Cambios auditados. Datos deportivos/financieros: solo lectura.
- [ ] Card "Entrenador(es)" por categoría con canal de contacto definido por la academia.
- [ ] Métricas por partido (goles/partido, etc.) calculadas en backend con la misma fuente que Inicio.
- [ ] Beca y descuentos se muestran como explicación del monto de la cuota (transparencia).
