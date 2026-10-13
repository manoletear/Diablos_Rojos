# Paquete: Vista Apoderado (portal de familias)

Especificación funcional de la vista **Apoderado** de una plataforma de gestión de academias deportivas,
levantada por ingeniería inversa (solo lectura) desde Telar / sistemadeportivo.cl el 13-10-2026.
Telar es **referencia funcional**, no algo a copiar: el objetivo es construir la vista en TU proyecto,
corrigiendo los gaps detectados.

Todo está anonimizado: no contiene nombres, RUT, teléfonos, correos ni montos reales.

## Cómo usarlo en Claude Code

1. Descomprime en la raíz del repo como `docs/vista-apoderado/`.
2. Abre Claude Code en el repo y pega el contenido de `prompts/00-descubrimiento.md`.
3. Avanza fase por fase con `prompts/01..06`. Cada prompt exige plan + aprobación antes de escribir código.
4. Si tu repo ya tiene `CLAUDE.md`, agrega la línea: `Ver docs/vista-apoderado/CLAUDE.md para el módulo apoderado.`

## Contenido

| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | Contexto y reglas del módulo para Claude Code |
| `specs/00-overview.md` | Rol, navegación, rutas, layout, reglas transversales |
| `specs/01..10-*.md` | Una spec por sección: pantallas, datos, acciones, user stories, criterios de aceptación |
| `data-model.md` | Entidades y relaciones derivadas de lo observado |
| `state-machines.md` | Estados y transiciones (convocatoria, cuota/pago, torneo, pedido, asistencia, partido) |
| `schema.sql` | DDL Postgres de referencia + políticas RLS opcionales (adaptar al stack/ORM real) |
| `gaps-y-mejoras.md` | Bugs e inconsistencias observadas en Telar + mejoras de producto priorizadas |
| `prompts/` | Prompts por fase para ejecutar en Claude Code |

## Niveles de confianza

Cada spec marca el origen de lo que afirma:
- **[OBS]** observado directamente en la UI.
- **[AYUDA]** tomado del Centro de Ayuda de Telar (no verificado en UI).
- **[INF]** inferido (modelo de datos, reglas). Validar contra tu dominio.

Lo que no se pudo verificar (sin ejecutar acciones que modifican datos): respuesta exacta tras Confirmar/Rechazar,
flujo completo de pago online, aprobación de torneo vigente, checkout de tienda.
