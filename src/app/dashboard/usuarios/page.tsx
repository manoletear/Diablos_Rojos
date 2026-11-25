import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invitarEntrenador, invitarApoderado } from "./actions";
import ReenviarBoton from "./reenviar-boton";
import ClaveEmergenciaBoton from "./clave-emergencia-boton";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error: errorMsg, ok } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user?.id ?? "").maybeSingle();

  if (profile?.rol !== "director" && profile?.rol !== "admin") notFound();

  const [{ data: profiles }, { data: entrenadores }, { data: apoderados }] = await Promise.all([
    supabase.from("profiles").select("id, email, nombre, rol").order("rol"),
    supabase.from("entrenadores").select("id, nombre, email, profile_id").order("nombre"),
    supabase.from("apoderados").select("id, nombre, email, profile_id").order("nombre"),
  ]);

  // profile_id se linkea al TIRO cuando se manda la invitación (el trigger
  // corre al crearse la fila en auth.users, no cuando la persona la abre) —
  // no sirve para saber si ya entró. Lo real es last_sign_in_at en auth.users,
  // que solo el cliente con service_role puede leer.
  let yaIngreso = new Set<string>();
  let sinConfirmar = new Set<string>();
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    yaIngreso = new Set((data?.users ?? []).filter((u) => u.last_sign_in_at).map((u) => u.id));
    // El bug real con María José: cuenta creada por invite, nunca abierta,
    // email_confirmed_at quedó null — signInWithPassword la rechaza aunque
    // tenga clave. "Clave de emergencia" solo tiene sentido mostrarla acá.
    sinConfirmar = new Set((data?.users ?? []).filter((u) => !u.email_confirmed_at).map((u) => u.id));
  } catch {
    // Sin SUPABASE_SERVICE_ROLE_KEY configurada todavia: no reventar la
    // pagina por esto, solo mostrar todos como "Invitado" hasta configurarla.
  }

  const directoresYAdmins = (profiles ?? []).filter((p) => p.rol === "director" || p.rol === "admin");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Usuarios</h1>
      <p className="text-sm text-neutral-500">
        Quién tiene cuenta y qué rol tiene. Director/admin se crean directo en la base de datos — profesores y
        apoderados se invitan desde aquí.
      </p>

      {errorMsg && (
        <div className="mt-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{errorMsg}</div>
      )}
      {ok && (
        <div className="mt-4 rounded-md bg-success-bg px-3 py-2 text-sm text-success">Invitación enviada.</div>
      )}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Directores y Administradores</div>
        <div className="mt-3 space-y-1.5 text-sm">
          {directoresYAdmins.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span>{p.nombre ?? p.email}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-600">{p.rol}</span>
            </div>
          ))}
          {directoresYAdmins.length === 0 && <div className="text-neutral-400">Ninguno todavía.</div>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="font-semibold text-neutral-900">Profesores</div>
          <div className="mt-3 space-y-2 text-sm">
            {(entrenadores ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
                <div>
                  <div className="font-medium text-neutral-800">{e.nombre}</div>
                  <div className="text-xs text-neutral-500">{e.email}</div>
                </div>
                {e.profile_id && yaIngreso.has(e.profile_id) ? (
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">Activo</span>
                ) : e.email ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">Invitado</span>
                    <ReenviarBoton tabla="entrenadores" email={e.email} />
                    {(!e.profile_id || sinConfirmar.has(e.profile_id)) && (
                      <ClaveEmergenciaBoton tabla="entrenadores" filaId={e.id} />
                    )}
                  </div>
                ) : (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">Sin email</span>
                )}
              </div>
            ))}
            {(entrenadores ?? []).length === 0 && <div className="text-neutral-400">Sin profesores todavía.</div>}
          </div>

          <form action={invitarEntrenador} className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
            <div className="text-xs font-medium text-neutral-500">Invitar nuevo profesor</div>
            <input name="nombre" placeholder="Nombre" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <input name="email" type="email" placeholder="Email" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <button type="submit" className="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
              Enviar invitación
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="font-semibold text-neutral-900">Apoderados</div>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
            {(apoderados ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
                <div>
                  <div className="font-medium text-neutral-800">{a.nombre}</div>
                  <div className="text-xs text-neutral-500">{a.email}</div>
                </div>
                {a.profile_id && yaIngreso.has(a.profile_id) ? (
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">Activo</span>
                ) : a.email ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">Invitado</span>
                    <ReenviarBoton tabla="apoderados" email={a.email} />
                    {(!a.profile_id || sinConfirmar.has(a.profile_id)) && (
                      <ClaveEmergenciaBoton tabla="apoderados" filaId={a.id} />
                    )}
                  </div>
                ) : (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">Sin email</span>
                )}
              </div>
            ))}
            {(apoderados ?? []).length === 0 && <div className="text-neutral-400">Sin apoderados todavía.</div>}
          </div>

          <form action={invitarApoderado} className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
            <div className="text-xs font-medium text-neutral-500">Invitar nuevo apoderado</div>
            <input name="nombre" placeholder="Nombre" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <input name="email" type="email" placeholder="Email" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <input name="telefono" placeholder="Teléfono (opcional)" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <button type="submit" className="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
              Enviar invitación
            </button>
          </form>
        </div>
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        El apoderado nunca tiene contraseña: siempre entra pidiendo un link de un solo uso desde /login.
      </p>
    </div>
  );
}
