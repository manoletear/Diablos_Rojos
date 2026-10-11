# Relación entre tablas por rol — Director / Entrenador / Apoderado

Mapa de las llaves (`profile_id`, FKs) que conectan a cada usuario con los
datos que debe ver o escribir, y el estado real de cada camino (verificado
contra `pg_policies` en Supabase, no supuesto).

## 1. Cómo se identifica cada usuario

```
auth.users.id = profiles.id   (1:1, creado por trigger handle_new_user() — migración 0039)
```

`profiles.rol` determina el rol. El trigger `handle_new_user()` (nuevo, migración
0039) se dispara al crear la cuenta (`/signup`) y:
1. Busca si el email coincide con `entrenadores.email` o `apoderados.email`
   (filas ya importadas del CSV, con `profile_id` todavía `null`).
2. Si coincide, reclama esa fila (`update ... set profile_id = new.id`) y
   asigna el rol correspondiente.
3. Si no coincide con nada, crea el profile igual con rol `apoderado` por
   defecto, pero sin fila vinculada — no ve nada vía RLS hasta que alguien
   (director) lo vincule a mano o se le cambie el rol.

**No crea alumnos/entrenadores/apoderados nuevos** — solo reclama filas que
ya existían. Alta de personas nuevas sigue siendo tarea del director desde
el panel (`Alumnos`, `Apoderados`, `Categorías`).

## 2. Cadena de llaves por rol

### Entrenador (Profesor)
```
profiles.id = entrenadores.profile_id
entrenadores.id → entrenador_categorias.entrenador_id
entrenador_categorias.categoria_id → categorias.id
categorias.id = alumnos.categoria_id (alumnos de sus categorías)
categorias.id = partidos.categoria_id (sus partidos)
```

### Apoderado
```
profiles.id = apoderados.profile_id
apoderados.id → apoderado_alumno.apoderado_id
apoderado_alumno.alumno_id → alumnos.id (sus hijos)
```

### Director / Admin
Sin cadena — `auth_rol() in ('director','admin')` ve todo.

## 3. Qué puede ESCRIBIR cada rol hoy (verificado en pg_policies)

| Tabla | Entrenador | Apoderado | Notas |
|---|---|---|---|
| `partidos` | ✅ escribe (sus categorías) | ❌ solo lee | |
| `convocatorias` | ✅ **arreglado ahora** (migración 0040) | ❌ | Antes solo director/admin — el entrenador no podía ni leer su propia convocatoria |
| `convocatoria_jugadores` | ✅ **arreglado ahora** | ❌ | Mismo hueco, bloqueaba el botón "Convocar" para entrenador |
| `lineups` | ✅ **arreglado ahora** | ❌ | Bloqueaba "Guardar formación" |
| `eventos_partido` | ✅ **arreglado ahora** | 🔸 solo lee los de sus hijos | Goles/tarjetas durante partido en vivo |
| `minutajes_partido` | ✅ ya existía | 🔸 solo lee los de sus hijos | |
| `partido_estado_vivo` | ✅ ya existía | 🔸 solo lee | |
| `registros_asistencia` | ✅ ya existía | 🔸 solo lee los de sus hijos | |
| `sesiones_entrenamiento` | ✅ ya existía | ❌ | |
| `alumnos` (datos core) | ❌ solo lee | ❌ solo lee | Correcto — editar ficha es tarea de director/admin |
| `mediciones_antropometricas` | 🔸 solo lee | 🔸 solo lee sus hijos | Pendiente decidir si el entrenador debería poder cargar peso/talla directamente |
| `lesiones_operativo` | 🔸 solo lee | 🔸 solo lee sus hijos | Pendiente decidir si el entrenador reporta la lesión o solo la ve |
| `pagos`, `pagos_transacciones` | ❌ sin acceso | 🔸 solo lee los suyos | Correcto — finanzas es solo staff |
| Capa clínica (`lesiones_clinico`, `psicologia_sesiones`) | ❌ sin acceso | ❌ sin acceso | Correcto — solo profesional de salud / director |

✅ = lee y escribe (ALL) · 🔸 = solo lee, scoped a lo suyo · ❌ = sin acceso

## 4. UI pendiente (no es problema de datos, es de interfaz)

Las páginas de `/dashboard` muestran los mismos botones a todos los roles.
Con los permisos de arriba, un entrenador que entre a Finanzas o intente
editar un alumno va a chocar con un error de RLS silencioso (el fetch
falla, no pasa nada visible). Falta:
- Esconder del `nav.ts` lo que el rol no puede usar (Finanzas, Apoderados,
  Categorías-editar, Salud, Comunicación ya están bien — confirmado contra
  el nav real de Telar para Coach).
- Esconder botones Editar/Eliminar en páginas que el entrenador sí ve pero
  no puede escribir (ej. lista de Alumnos — ve, no edita).

## 5. Pendiente de decisión (no tocado, para no asumir de más)

- ¿Entrenador carga mediciones antropométricas (peso/talla) directo, o eso
  sigue siendo solo del equipo de salud?
- ¿Entrenador reporta una lesión (capa operativa) desde el partido, o solo
  la ve una vez que salud la carga?

## 6. Qué falta para que esto funcione end-to-end

1. ~~Trigger de auto-vínculo por email~~ ✅ hecho (migración 0039)
2. ~~Página `/signup`~~ ✅ hecha
3. ~~RLS de convocatoria/lineup/eventos para entrenador~~ ✅ hecho (migración 0040)
4. **Cuentas reales**: hoy cero entrenadores/apoderados tienen cuenta creada.
   Cuando alguien se registre con el email que el club ya tiene cargado, se
   vincula solo.
5. Nav + botones condicionados por rol en las páginas que entrenador/apoderado
   ya pueden ver (punto 4 de la sección anterior) — pendiente.
