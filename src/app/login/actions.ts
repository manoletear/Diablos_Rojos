"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/origin";

// Apoderados no tienen contraseña: piden un magic link cada vez.
// shouldCreateUser:false asegura que solo entra quien ya fue invitado por
// un admin (ver src/app/dashboard/usuarios/actions.ts) — nadie puede
// crearse una cuenta tipeando cualquier email aquí.
export async function pedirMagicLink(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    redirect(`/login?magicError=${encodeURIComponent("No pudimos enviar el link. Si tu cuenta ya existe, pide a tu academia que revise el email registrado.")}`);
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
