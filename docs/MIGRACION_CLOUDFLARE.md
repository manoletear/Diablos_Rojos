# Migración Supabase → Cloudflare — Fase 2: Diseño

Estado: **diseño, nada ejecutado todavía**. Requiere tu aprobación explícita
antes de Fase 3 (construcción). Ver Fase 1 en el historial de conversación
(59 tablas, 117 RLS policies, 20 funciones, 13 triggers, 36 enums, 1 usuario
Auth real, 17 MB).

## 1. Mapeo de esquema (Postgres → D1/SQLite)

| Postgres | D1 (SQLite) | Nota |
|---|---|---|
| `uuid primary key default gen_random_uuid()` | `text primary key` | UUID generado en código (`crypto.randomUUID()`), no en la DB |
| `enum` (36 tipos) | `text` + `check (col in (...))` | SQLite no tiene enum nativo |
| `timestamptz` | `text` (ISO 8601) | Comparaciones por string funcionan porque ISO 8601 es ordenable |
| `numeric(12,2)` | `integer` (centavos) | Evita errores de float; monto real = valor / 100 |
| `jsonb` | `text` (JSON.stringify) | Sin operadores jsonb nativos, se parsea en código |
| `foreign key ... on delete cascade/set null` | igual, D1 soporta FK | Hay que activar `PRAGMA foreign_keys = ON` por conexión |
| RLS (117 policies) | **nada nativo** | Ver sección 3 |

## 2. Triggers y funciones (13 + 20) → código de aplicación

Cada trigger/función de Postgres se reescribe como lógica explícita dentro
del server action que hace el insert/update correspondiente (ya existen casi
todos como archivos `actions.ts` por módulo):

| Postgres (hoy) | Se mueve a | Complejidad |
|---|---|---|
| `recalcular_pago()` (trigger en `pagos_transacciones`) | `finanzas/actions.ts` → `registrarAbono()` recalcula `monto_pagado`/`estado` en la misma transacción | Baja |
| `minutaje_vivo()` | Query agregada en `minutaje/page.tsx`, ya es solo lectura | Baja |
| `ingresos_periodo()`, `flujo_caja_periodo()` | Query agregada en `flujo-caja/page.tsx` | Baja |
| `calcular_percentil_oms()` | Función TS pura con tabla de percentiles OMS embebida | Media |
| `trigger_mensaje_convocatoria`, `trigger_mensaje_pago_vencido`, `trigger_mensaje_entrenamiento_excepcion` | Ya migrado parcialmente a `src/lib/notificaciones.ts` — se completa ahí, se elimina el trigger DB | Baja (ya hay precedente) |
| `check_consentimiento_psicologia`, `consentimiento_vigente` | Check explícito antes de crear sesión de psicología en `salud/actions.ts` | Media — es control de seguridad clínica, revisar con cuidado |
| `log_salud_audit()` | Insert explícito a `salud_audit_log` en cada mutación de tablas clínicas | Media |
| `puede_enviar_mensaje()` (anti-spam) | Función TS en `notificaciones.ts` | Baja |
| `validar_variables_plantilla` | Validación Zod al guardar plantilla | Baja |
| `confirmar_convocatoria_por_token` | Route handler `/api/confirmar/[token]` (pendiente, Fase 5 Comunicación igual hoy) | Baja |

## 3. RLS (117 policies) → autorización en código

No hay equivalente nativo en D1. Reemplazo: **capa de autorización
centralizada**, un helper por tabla sensible llamado al inicio de cada
server action, mismo patrón ya usado (`auth_rol()` hoy es SQL, pasa a ser
TS):

```ts
// src/lib/auth-guard.ts (nuevo)
requireRole(session, ["director", "admin"])
requireApoderadoDeAlumno(session, alumnoId)  // reemplaza policies tipo "apoderado solo ve sus hijos"
requireProfesionalSaludDeCaso(session, casoId)  // reemplaza las policies en capas de salud
```

Riesgo real: hoy si alguien olvida una policy, Postgres igual bloquea por
default (RLS deniega si no hay policy). En D1, si alguien olvida el check en
el código, **no hay red de seguridad** — la query simplemente corre. Esto es
el punto más delicado de toda la migración, especialmente para las tablas de
salud clínica de menores.

**Mitigación propuesta**: wrapper único `withAuth(rol_requerido, fn)` que
todas las queries sensibles deben pasar obligatoriamente — nunca `db.query`
directo en código de negocio — más tests automatizados de autorización por
tabla antes del corte.

## 4. Auth

Con 1 solo usuario Auth real hoy, se simplifica mucho:

- **Staff (director/admin/entrenador)**: Cloudflare Access (Zero Trust) —
  allowlist de emails, login con Google/magic link, cero contraseñas que
  administrar, gratis hasta 50 usuarios.
- **Apoderados** (futuro Portal, hoy no implementado): sesiones propias en
  D1 + magic link vía Cloudflare Email Routing, cuando se retome Fase 6 del
  plan original (`docs/PLAN.md`).

## 5. Storage (Supabase Storage → R2)

Confirmado en uso real: `pagos.comprobante_url`, `pagos_transacciones.comprobante_url`,
`lesiones_adjuntos`, `psicologia_adjuntos`, `catalogo_productos.imagen_url`.
Los adjuntos clínicos (`lesiones_adjuntos`, `psicologia_adjuntos`) son los
más sensibles — mismo cuidado de autorización que en sección 3, acceso
firmado/temporal vía Worker, nunca URL pública directa.

## 6. Hosting

Next.js hoy en Netlify. Para hablar con D1 directo (sin pasar por HTTP API)
hay que correr en el runtime de Cloudflare: `@opennextjs/cloudflare`, deploy
vía `wrangler deploy`. Esto reemplaza Netlify completo, no solo la DB.

## 7. Plan de ejecución (sub-fases, cada una con corte limpio y tu aprobación)

| Fase | Qué hace | Toca producción? |
|---|---|---|
| **3** | Crear schema D1 + script de migración de datos (dump Postgres → transform → import D1), en un proyecto D1 de prueba | No — Supabase intacto |
| **4** | Reescribir capa de datos detrás de un adaptor único (`src/lib/db.ts`), de forma que el resto del código no sepa si pega a Postgres o D1 — permite correr ambos en paralelo y comparar resultados | No — se prueba contra copia D1 |
| **5** | Mover triggers/funciones/RLS a código (secciones 2 y 3), con tests de autorización por tabla | No — se prueba contra copia D1 |
| **6** | Cutover de Auth a Cloudflare Access (bajo riesgo: 1 usuario real) | Sí — login |
| **7** | Cutover de hosting a Cloudflare Workers + corte final de datos (último sync Postgres→D1) + decommission Supabase (se mantiene de respaldo N días) | Sí — producción completa |

**Checkpoint de aprobación obligatorio antes de cada fase**, igual que en el
resto del proyecto. Nada de esto se ejecuta hasta que confirmes Fase 3.
