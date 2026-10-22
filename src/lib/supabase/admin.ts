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
