"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrigin } from "@/lib/origin";

// Apoderados no tienen contraseña: piden un magic link cada vez. La
// autorización real es estar en la tabla "apoderados" (se crea cuando se
// matricula a su hijo) — no hace falta que un admin los invite aparte. Si
// el email existe ahí pero todavía no tiene cuenta de auth, se crea en
// silencio (sin mandar el correo de invite de Supabase) y se manda
// directo el magic link. Si el email NO está en "apoderados", se rechaza
// sin crear nada — eso es lo que evita que cualquiera tipee un email al
// azar y se autocree una cuenta.
export async function pedirMagicLink(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const supabase = await createClient();
  const origin = await getOrigin();

  // Cliente admin aca, no el de sesion: quien pide el magic link todavia no
  // esta autenticado, y RLS no tiene (ni debe tener) una policy publica que
  // deje leer "apoderados" sin sesion — eso abriria enumeracion de emails.
  const admin = createAdminClient();
  const { data: apoderado } = await admin
    .from("apoderados")
    .select("id, nombre, profile_id")
    .eq("email", email)
    .maybeSingle();

  if (!apoderado) {
    redirect(`/login?magicError=${encodeURIComponent("No encontramos una cuenta de apoderado con ese correo. Contacta a la academia para que revisen el email registrado.")}`);
  }

  if (!apoderado.profile_id) {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { nombre: apoderado.nombre, rol: "apoderado" },
    });
    // "already registered" puede pasar si quedó un auth.users huerfano sin
    // vincular (ej. un intento previo) — no es un error real, seguimos igual.
    if (createError && !createError.message.includes("already registered")) {
      redirect(`/login?magicError=${encodeURIComponent("No pudimos preparar tu cuenta. Intenta de nuevo o contacta a la academia.")}`);
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    redirect(`/login?magicError=${encodeURIComponent("No pudimos enviar el link. Intenta de nuevo en unos minutos.")}`);
  }

  redirect("/login?magicSent=1");
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
