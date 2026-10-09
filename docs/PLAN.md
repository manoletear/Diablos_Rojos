# Plan de desarrollo — Plataforma Diablos Rojos (multiusuario)

Basado en: `Backups/scope-funcional-inspiracion.md` (inventario funcional,
inspirado en Telar, sin código ni datos de terceros).

## 1. Objetivo

Sistema de gestión propio para la academia Diablos Rojos: alumnos, apoderados,
pagos, asistencia, partidos, salud, multiusuario con roles diferenciados.
Reemplaza dependencia de Telar.

## 2. Stack propuesto

| Capa | Elección | Motivo |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind | SSR, rutas por rol, ecosistema maduro |
| Backend / DB | Supabase (Postgres + Auth + Storage + RLS) | Multiusuario con Row Level Security nativo, MCP ya conectado |
| Auth | Supabase Auth (email/password + magic link) | Roles vía tabla `profiles` + RLS, invita apoderados por email |
| Hosting | Vercel (frontend) + Supabase Cloud (DB) | Deploy directo desde GitHub repo ya creado |
| Validación | Zod | Consistente cliente/servidor |
| ORM | Supabase client + tipos generados (`generate_typescript_types`) | Evita capa extra |

Repo: `https://github.com/manoletear/Diablos_Rojos` (ya clonado en `repo/`).

**Pendiente de aprobación**: crear proyecto Supabase nuevo tiene costo —
necesito confirmación tuya (org "ELITE Runner", región sa-east-1) antes de
provisionar.

## 3. Multiusuario — roles y permisos

| Rol | Alcance |
|---|---|
| `director` | Acceso total (visto en producción: franco.illino@gmail.com) |
| `admin` | Gestión operativa (alumnos, pagos, asistencia) sin config org |
| `entrenador` | Solo sus categorías: asistencia, convocatorias, minutaje |
| `apoderado` | Solo sus hijos: ficha, pagos propios, asistencia propia |

Implementación: tabla `profiles` (1:1 con `auth.users`) + `user_roles` +
tabla puente `entrenador_categorias` / `apoderado_alumnos`. RLS policies por
tabla filtran por rol + relación (ej. apoderado solo ve `alumnos` donde
existe fila en `apoderado_alumnos`).

## 4. Modelo de datos (consolidado)

### Núcleo
- `sedes` (id, nombre)
- `temporadas` (id, nombre, fecha_inicio, fecha_fin, activa)
- `categorias` (id, nombre, sede_id FK, anio_desde, anio_hasta, dias_horario, estado)
- `entrenadores` (id, profile_id FK nullable, nombre, email, telefono)
- `entrenador_categorias` (entrenador_id FK, categoria_id FK)

### Personas
- `apoderados` (id, profile_id FK nullable, nombre, email, telefono)
- `alumnos` (id, nombre, apellido, rut, fecha_nacimiento, categoria_id FK,
  sede_id FK, estado [en_prueba|matriculado|retirado], posicion,
  numero_camiseta, nombre_camiseta, talla_camiseta, beca_pct,
  cuota_personalizada, fecha_inscripcion, temporada_id FK)
- `apoderado_alumno` (apoderado_id FK, alumno_id FK, parentesco, es_principal)
- `fichas_medicas` (alumno_id FK único, grupo_sanguineo, condiciones_medicas,
  alergias, seguro_escolar, nombre_seguro)

### Salud
- `mediciones` (id, alumno_id FK, fecha, peso_kg, talla_cm, imc calculado,
  percentil, diagnostico [normal|bajo_peso|sobrepeso|obesidad])
- `alertas_antropometricas` (id, medicion_id FK, estado [pendiente|revisada],
  nota_revision, revisada_por FK profiles, revisada_en)

### Asistencia
- `sesiones_entrenamiento` (id, categoria_id FK, fecha)
- `registros_asistencia` (id, sesion_id FK, alumno_id FK,
  estado [presente|ausente|tardanza|justificada])

### Finanzas
- `pagos` (id, alumno_id FK, tipo [matricula|mensualidad], periodo,
  sede_id FK, monto_total, monto_pagado, monto_pendiente,
  estado [pendiente|parcial|por_comprobar|pagado|vencido],
  fecha_vencimiento, fecha_registro, es_proporcional, dias_proporcional)
- `comprobantes_pago` (id, pago_id FK, archivo_url, estado_revision)

### Deportivo
- `recintos` (id, nombre)
- `torneos` (id, nombre, formato_tiempos, formato_minutos)
- `partidos` (id, categoria_id FK, torneo_id FK, recinto_id FK, rival,
  fecha_hora, local_visita, estado [programado|en_curso|completado|cancelado],
  resultado_local, resultado_rival)
- `convocatorias` (partido_id FK único)
- `convocatoria_jugadores` (convocatoria_id FK, alumno_id FK)
- `lineups` (partido_id FK único, formacion, datos_json)
- `eventos_partido` (id, partido_id FK, alumno_id FK, minuto, tipo [gol|amarilla|roja|cambio])
- `minutajes` (id, partido_id FK, alumno_id FK, minutos_jugados)

### Comunicación (fase 2)
- `mensajes` (id, remitente_profile_id, destinatario_tipo, destinatario_id, canal [whatsapp|email], cuerpo, enviado_en)

## 5. Fases de entrega

**Fase 1 — Núcleo (MVP interno)**
Auth + roles, Sedes/Temporadas/Categorías, Alumnos + Apoderados (CRUD +
import CSV con el export que ya tienes como seed), Dashboard básico.

**Fase 2 — Operación diaria**
Asistencia (registro por categoría/fecha), Pagos (listado + generación
masiva mensualidad + estados), Reporte Asistencias.

**Fase 3 — Salud**
Mediciones antropométricas + cálculo IMC/percentil + alertas automáticas +
flujo de revisión.

**Fase 4 — Deportivo**
Categorías→Partidos, Convocatoria, Lineup, Tablero en vivo, Torneos,
Calendario, Minutaje, Estadísticas.

**Fase 5 — Dashboard Ejecutivo + Comunicación**
KPIs consolidados, envío de mensajes a apoderados (WhatsApp/email).

## 6. Siguiente paso inmediato

1. Confirmar provisión Supabase (costo) → crear proyecto.
2. Aplicar migración Fase 1 (`sedes`, `temporadas`, `categorias`, `profiles`,
   `apoderados`, `alumnos`, `apoderado_alumno`, `fichas_medicas`) + RLS.
3. Resolver scaffold Next.js (conflicto de carpeta pendiente en `repo/`).
4. Importar seed desde `Backups/alumnos_activos_2026-10-09.csv`.
5. Deploy inicial a Vercel apuntando al repo.
