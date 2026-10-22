# Migración Supabase → Cloudflare

## Estado (actualizado 2026-10-11)

- **Fase 1 — Diagnóstico**: ✅ completa (ver sección histórica abajo).
- **Fase 2 — Diseño**: ✅ completa (mapeo de esquema, plan de ejecución).
- **Fase 3 — Schema + datos en D1 staging**: ✅ completa.
  - DB `taktik-d1-staging` (`ac2ddd0b-ebb4-414b-a0bf-00c2d99d2aaa`), 59 tablas.
  - Scripts en `scripts/migrate-to-d1/01-generate-schema.js` y `03-migrate-data.js`
    (introspección automática de Postgres, reutilizables si hay que resincronizar).
  - Datos reales copiados y verificados 1:1 con Supabase (alumnos 203,
    apoderados 397, pagos 196, convocatoria_jugadores 4953). `lesiones_clinico`
    y `psicologia_sesiones` en 0 filas — nunca se cargó un registro clínico real.
  - Supabase intacto en todo momento (solo lectura).
- **Fase 4 — Adaptor de datos**: ✅ prueba de concepto completa.
  - `src/lib/db/adapter.ts` — interfaz `DbAdapter` (`query`/`queryOne`), agnóstica de backend.
  - `src/lib/db/postgres-adapter.ts` — implementación real contra Supabase.
  - `src/lib/db/d1-adapter.ts` — implementación contra D1 vía HTTP API (puente
    temporal; en Fase 7, con hosting en Workers, se cambia al binding nativo
    `env.DB.prepare()`, sin HTTP de por medio). Hoy requiere `CLOUDFLARE_API_TOKEN`
    con permiso D1:Edit — **pendiente generar uno acotado antes de producción**,
    las pruebas de este momento reusaron el token OAuth personal de la CLI.
  - `scripts/migrate-to-d1/04-compare-queries.js` — corrió 3 consultas
    representativas (Alumnos, Finanzas, Partidos/Convocatoria) contra ambos
    backends. **Paridad confirmada**: los únicos 2 casos marcados con
    diferencia fueron orden entre filas empatadas (sin columna de desempate
    en el `ORDER BY`), no error de datos — los valores (conteos, sumas,
    conversión a centavos) coinciden exactamente.
  - **Nota de alcance**: no se migraron los ~30 módulos de la app a usar este
    adaptor todavía — eso es trabajo real pendiente (reemplazar cada
    `createClient()` de Supabase por `DbAdapter`), fuera del scope de esta
    prueba de concepto. Se hace en sub-pasos cuando se retome.
- **Fase 5 (RLS→código)**: 🟡 iniciada (2026-10-22), lejos de completa.
  - `src/lib/auth-guard.ts` — helpers base: `requireRole`, `requireStaff`,
    `requireSelf`, `requireApoderadoDeAlumno`, `requireEntrenadorEditaAlumno`,
    `esEntrenadorDeCategoria`, `requireApoderadoConvocadoEnPartido`, `withAuth`.
    Escriben SQL portable con `?` (estilo D1); `postgres-adapter.ts` ahora
    traduce `?` → `$1,$2,...` para que el mismo código sirva en ambos backends.
  - `docs/rls-inventario.json` — dump completo de las **135** policies reales
    de hoy (el plan original decía 117; crecieron con el trabajo de
    invitaciones/magic link de esta semana) — es el worksheet real para
    portar el resto, tabla por tabla.
  - 3 de 135 policies verificadas con casos reales positivo/negativo contra
    la base real (apoderado↔hijo propio/ajeno, entrenador↔categoría propia) —
    coinciden exacto con el comportamiento RLS actual.
  - `requireProfesionalSaludDeCaso` queda explícitamente **sin implementar**:
    las tablas de salud/psicología no tienen datos reales todavía (Fase 3),
    adivinar ese modelo de autorización sin confirmarlo es el tipo de riesgo
    que este documento ya advertía evitar.
  - Sin framework de test automatizado todavía (el repo no tiene
    vitest/jest configurado) — se verificó a mano por ahora, decisión de
    herramienta pendiente de confirmar con Manuel antes de asumir una.
  - **Falta**: las ~132 policies restantes, y migrar los ~30 módulos de la
    app para que llamen estos guards en vez de depender de RLS.
- **Fase 6 (Auth) y 7 (hosting)**: no iniciadas. Requieren tu aprobación
  explícita antes de empezar cada una. Fase 6 ya tiene diseño propio (ver
  sección 4 más abajo), pendiente de construirse.

---

## Fase 1-2 (histórico)

Ver Fase 1 en el historial de conversación (59 tablas, 117 RLS policies, 20
funciones, 13 triggers, 36 enums, 1 usuario Auth real, 17 MB).

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

## 4. Auth (replanificado 2026-10-22 — el original quedó obsoleto)

El plan original asumía "1 solo usuario Auth real" y proponía Cloudflare
Access (SSO de staff) para todos. Eso ya no aplica: entre el 13 y el 21 de
octubre se construyó sobre Supabase Auth un sistema completo —

- Invitaciones admin→entrenador/apoderado (`admin.inviteUserByEmail`)
- Apoderados **sin contraseña nunca**, piden magic link de 30 min
  (`signInWithOtp`, `shouldCreateUser:false`)
- Staff con contraseña normal (`signInWithPassword`)
- Trigger de auto-link por email (`handle_new_user()`)
- ~12 RLS policies nuevas sobre este flujo

Cloudflare Access está pensado para SSO de empleados vía allowlist, no para
cientos de apoderados externos con passwordless self-service — llevar este
sistema ahí significa **reconstruir un Auth propio**, no cambiar de
proveedor. Diseño propuesto:

### Tablas nuevas en D1

| Tabla | Columnas clave | Reemplaza |
|---|---|---|
| `auth_users` | `id, email, rol, password_hash (nullable), created_at` | `auth.users` + `profiles` fusionados (hoy están separados en Supabase) |
| `auth_invites` | `token_hash, email, rol, tabla_destino, expires_at, used_at` | `admin.inviteUserByEmail` |
| `auth_magic_links` | `token_hash, email, expires_at (+30min), used_at` | `signInWithOtp` |
| `auth_sessions` | `id, user_id, expires_at, created_at` | cookie de sesión de Supabase SSR |

Sesión **con estado** (tabla, no JWT stateless): permite "cerrar todas mis
sesiones" y revocar al tiro, y un `SELECT` a D1 es barato — no hay razón
real para la complejidad extra de JWT+refresh aquí.

### Hashing de contraseña

`bcrypt`/`argon2` nativos no corren en el runtime de Workers (dependen de
código nativo). Usar **PBKDF2 vía Web Crypto** (`crypto.subtle`, disponible
nativo en Workers) — patrón estándar documentado por Cloudflare para esto.

### Envío de correo (invites + magic link)

Resend (ya hay placeholder `RESEND_API_KEY` en `.env.local`, pendiente de
cuenta real) — se llama vía `fetch()` normal desde el Worker, no necesita
SDK de Node.

### Rutas (reemplazan a los Route Handlers de Next.js actuales)

| Hoy (Next.js + Supabase) | Cloudflare |
|---|---|
| `login/actions.ts` → `signInWithPassword` | `POST /auth/login` — verifica `password_hash` con PBKDF2, crea fila en `auth_sessions`, set-cookie |
| `login/actions.ts` → `pedirMagicLink` | `POST /auth/magic-link` — genera token random, guarda hash en `auth_magic_links`, envía correo por Resend |
| `auth/confirm/route.ts` | `GET /auth/confirm?token=...` — valida hash+expiry+`used_at is null`, marca usado, crea sesión |
| `dashboard/usuarios/actions.ts` → `invitarEntrenador/Apoderado` | `POST /admin/invitar` — mismo patrón que magic link pero con `rol`/`tabla_destino` |
| `auth/set-password/actions.ts` | `POST /auth/set-password` — solo si hay sesión activa de un invite recién aceptado |
| middleware de Supabase SSR (`src/lib/supabase/middleware.ts`) | Worker middleware: lee cookie de sesión, valida contra `auth_sessions`, inyecta `rol` en el contexto — mismo rol que hoy cumplen las RLS policies, ahora explícito en código (ver Fase 5, `auth-guard.ts`) |

### Riesgos nuevos que no existían en el plan original

- **Rate limiting**: Supabase ya limita intentos de magic link/invite por
  IP/email. Si se reconstruye a mano, hay que agregar esto explícito (regla
  de Cloudflare o contador en D1) — si se omite, es una superficie de abuso
  nueva (alguien podría pedir magic links en loop).
- **Expiración de 30 min pedida por Manuel**: hoy es config del Dashboard de
  Supabase (OTP Expiry); en Cloudflare hay que calcularla a mano en cada
  `INSERT` a `auth_magic_links` y validarla en el `GET /auth/confirm`.
- Esta fase ahora depende de que Fase 5 (`auth-guard.ts`, `requireRole` etc.)
  esté lista primero — las rutas de arriba llaman a esos mismos helpers.

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
