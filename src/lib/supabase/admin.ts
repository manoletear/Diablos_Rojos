import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con service_role: bypassa RLS por completo. SOLO usar en Server
// Actions ya gateadas por rol (director/admin) — nunca importar desde un
// componente cliente ni exponer SUPABASE_SERVICE_ROLE_KEY con prefijo NEXT_PUBLIC_.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno. Agrégala en .env.local (Supabase Dashboard → Settings → API → service_role) y en las env vars de Netlify."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Punto único para dejar una cuenta de auth lista para usar, sea cual sea
// el camino que la originó (invite, magic link sin invitación, o clave de
// emergencia). Antes esto se hacía a mano en 3 lugares distintos y en uno
// faltó `email_confirm: true` — María José quedó con cuenta+clave pero sin
// poder entrar ("Email not confirmed") hasta que lo pescamos a mano.
// Esta función SIEMPRE deja email_confirm:true, no importa el camino.
export async function provisionarUsuario(params: {
  email: string;
  nombre: string;
  rol: "director" | "admin" | "entrenador" | "apoderado";
  profileId?: string | null; // si ya se conoce (profiles/entrenadores/apoderados.profile_id), se reusa
  password?: string; // si se da, se setea (ej. clave de emergencia); si no, queda passwordless para invite/magic-link
}): Promise<{ userId: string }> {
  const admin = createAdminClient();
  const email = params.email.trim().toLowerCase();
  let userId = params.profileId ?? null;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: params.password,
      user_metadata: { nombre: params.nombre, rol: params.rol },
    });
    if (error) {
      if (!error.message.toLowerCase().includes("already registered")) throw error;
      // Auth user huerfano de un intento previo (ej. invite nunca aceptado) — lo reusamos.
      const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;
      const existente = list.users.find((u) => u.email?.toLowerCase() === email);
      if (!existente) throw error;
      userId = existente.id;
    } else {
      userId = data.user.id;
    }
  }

  // Confirma SIEMPRE, y setea la clave si se pidió una — ambos en la misma
  // llamada para no dejar un estado a medias si algo falla entre medio.
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
    ...(params.password ? { password: params.password } : {}),
  });
  if (updateError) throw updateError;

  return { userId };
}
