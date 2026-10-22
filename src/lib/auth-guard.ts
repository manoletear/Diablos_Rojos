// Fase 5 — capa de autorizacion centralizada, reemplaza las 135 RLS policies
// de Postgres (inventario completo en docs/rls-inventario.json) para cuando
// el backend sea D1, que no tiene equivalente nativo a RLS.
//
// Regla dura: ninguna query sensible corre sin pasar por uno de estos
// helpers primero. A diferencia de Postgres (deniega por default si falta
// una policy), si alguien olvida llamar un guard aca la query simplemente
// corre sin control — por eso cada modulo nuevo en D1 debe listar aca que
// guard usa, no asumirlo.

import type { DbAdapter } from "./db/adapter";

export type Rol = "director" | "admin" | "entrenador" | "apoderado";

export type Session = {
  userId: string;
  rol: Rol;
};

export class AuthError extends Error {
  constructor(message = "No autorizado") {
    super(message);
    this.name = "AuthError";
  }
}

const STAFF: Rol[] = ["director", "admin"];

/** Equivalente a `auth_rol() = ANY (ARRAY[...])` en las policies de Postgres. */
export function requireRole(session: Session | null, roles: Rol[]): Session {
  if (!session) throw new AuthError("Sin sesion");
  if (!roles.includes(session.rol)) throw new AuthError(`Rol ${session.rol} no autorizado, requiere ${roles.join("/")}`);
  return session;
}

/** director o admin — el caso mas comun, equivalente a staff_all_* en casi todas las tablas. */
export function requireStaff(session: Session | null): Session {
  return requireRole(session, STAFF);
}

/** Equivalente a `profile_id = auth.uid()` — self-read en entrenadores/apoderados/profiles. */
export function requireSelf(session: Session | null, profileId: string | null): Session {
  if (!session) throw new AuthError("Sin sesion");
  if (session.userId !== profileId) throw new AuthError("Solo puedes ver/editar tu propio registro");
  return session;
}

/**
 * Equivalente a apoderado_read_self + apoderado_alumno join — reemplaza
 * policies tipo "el apoderado solo ve a sus propios hijos" (mis-hijos,
 * pagos, asistencias, convocatorias del alumno, etc).
 */
export async function requireApoderadoDeAlumno(db: DbAdapter, session: Session | null, alumnoId: string): Promise<Session> {
  if (!session) throw new AuthError("Sin sesion");
  if (STAFF.includes(session.rol)) return session; // staff ve todo, igual que staff_all_*
  if (session.rol !== "apoderado") throw new AuthError("Solo apoderados o staff");
  const row = await db.queryOne(
    `select 1 from apoderado_alumno aa
     join apoderados ap on ap.id = aa.apoderado_id
     where ap.profile_id = ? and aa.alumno_id = ?`,
    [session.userId, alumnoId]
  );
  if (!row) throw new AuthError("Ese alumno no es tu hijo");
  return session;
}

/**
 * Equivalente a entrenador_read_alumnos_para_citar (lectura amplia, para
 * poder citar jugadores de otra categoria a un partido). NO usar para
 * mutaciones — ver requireEntrenadorEditaAlumno abajo.
 */
export function requireEntrenadorOStaff(session: Session | null): Session {
  return requireRole(session, ["director", "admin", "entrenador"]);
}

/**
 * Equivalente a entrenador_update_alumnos — editar ficha de un alumno solo
 * si es de una categoria que el entrenador tiene asignada (entrenador_categorias).
 * Mas estricto que requireEntrenadorOStaff: ese es lectura amplia, este es
 * escritura scoped.
 */
export async function requireEntrenadorEditaAlumno(db: DbAdapter, session: Session | null, alumnoId: string): Promise<Session> {
  if (!session) throw new AuthError("Sin sesion");
  if (STAFF.includes(session.rol)) return session;
  if (session.rol !== "entrenador") throw new AuthError("Solo entrenador o staff");
  const row = await db.queryOne(
    `select 1 from alumnos al
     join entrenador_categorias ec on ec.categoria_id = al.categoria_id
     join entrenadores e on e.id = ec.entrenador_id
     where e.profile_id = ? and al.id = ?`,
    [session.userId, alumnoId]
  );
  if (!row) throw new AuthError("Ese alumno no es de una categoria a tu cargo");
  return session;
}

/**
 * Equivalente a entrenador_read_categorias_todas / entrenador_categorias
 * propias — true si la categoria es una de las que tiene asignada.
 */
export async function esEntrenadorDeCategoria(db: DbAdapter, session: Session, categoriaId: string): Promise<boolean> {
  if (STAFF.includes(session.rol)) return true;
  if (session.rol !== "entrenador") return false;
  const row = await db.queryOne(
    `select 1 from entrenador_categorias ec
     join entrenadores e on e.id = ec.entrenador_id
     where e.profile_id = ? and ec.categoria_id = ?`,
    [session.userId, categoriaId]
  );
  return !!row;
}

/**
 * Equivalente a la funcion plpgsql apoderado_convocado_en_partido() —
 * rompe el ciclo de recursion RLS entre convocatorias/convocatoria_jugadores
 * viendolo como join directo en vez de policy-sobre-policy. Cubre el caso
 * de citacion cruzada de categoria (ver migracion 0047).
 */
export async function requireApoderadoConvocadoEnPartido(db: DbAdapter, session: Session | null, partidoId: string): Promise<Session> {
  if (!session) throw new AuthError("Sin sesion");
  if (STAFF.includes(session.rol) || session.rol === "entrenador") return session;
  if (session.rol !== "apoderado") throw new AuthError("Solo apoderados o staff");
  const row = await db.queryOne(
    `select 1 from convocatoria_jugadores cj
     join convocatorias c on c.id = cj.convocatoria_id
     join apoderado_alumno aa on aa.alumno_id = cj.alumno_id
     join apoderados ap on ap.id = aa.apoderado_id
     where c.partido_id = ? and ap.profile_id = ?`,
    [partidoId, session.userId]
  );
  if (!row) throw new AuthError("No tienes un hijo convocado a ese partido");
  return session;
}

/**
 * Equivalente a check_consentimiento_psicologia / profesional_salud_de_caso
 * — PENDIENTE de portar (tablas de lesiones y psicologia aun no tienen
 * datos reales, ver docs/MIGRACION_CLOUDFLARE.md Fase 3). No implementar a
 * ciegas sin confirmar con Manuel el modelo real de "profesional asignado a
 * un caso" cuando haya datos de verdad — alto riesgo si se adivina mal.
 */
export function requireProfesionalSaludDeCaso(): never {
  throw new Error("No implementado todavia — ver nota en auth-guard.ts, confirmar modelo real antes de portar");
}

/**
 * Wrapper para rutas de Worker: valida sesion+rol ANTES de ejecutar el
 * handler, mismo espiritu que "withAuth" descrito en MIGRACION_CLOUDFLARE.md.
 * Uso: `withAuth(["director","admin"], (session) => { ... })`
 */
export function withAuth<T>(roles: Rol[], handler: (session: Session) => Promise<T>) {
  return async (session: Session | null): Promise<T> => {
    const s = requireRole(session, roles);
    return handler(s);
  };
}
