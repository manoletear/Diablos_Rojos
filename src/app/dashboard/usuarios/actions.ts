"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrigin } from "@/lib/origin";

async function exigirDirectorOAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user?.id ?? "").maybeSingle();
  if (profile?.rol !== "director" && profile?.rol !== "admin") {
    throw new Error("Solo director o admin pueden invitar usuarios.");
  }
  return supabase;
}

type InvitarResultado = { ok: boolean; error?: string };

export async function invitarEntrenador(formData: FormData) {
  const supabase = await exigirDirectorOAdmin();
  const nombre = (formData.get("nombre") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();

  const { data: existente } = await supabase.from("entrenadores").select("id, profile_id").eq("email", email).maybeSingle();
  if (existente?.profile_id) {
    redirect(`/dashboard/usuarios?error=${encodeURIComponent("Ese email ya tiene una cuenta activa.")}`);
  }
  if (!existente) {
    const { error: insertError } = await supabase.from("entrenadores").insert({ nombre, email });
    if (insertError) redirect(`/dashboard/usuarios?error=${encodeURIComponent(insertError.message)}`);
  }

  const admin = createAdminClient();
  const origin = await getOrigin();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nombre, rol: "entrenador" },
    redirectTo: `${origin}/auth/confirm?type=invite`,
  });
  if (error) redirect(`/dashboard/usuarios?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard/usuarios");
  redirect("/dashboard/usuarios?ok=1");
}

export async function invitarApoderado(formData: FormData) {
  const supabase = await exigirDirectorOAdmin();
  const nombre = (formData.get("nombre") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const telefono = (formData.get("telefono") as string)?.trim() || null;

  const { data: existente } = await supabase.from("apoderados").select("id, profile_id").eq("email", email).maybeSingle();
  if (existente?.profile_id) {
    redirect(`/dashboard/usuarios?error=${encodeURIComponent("Ese email ya tiene una cuenta activa.")}`);
  }
  if (!existente) {
    const { error: insertError } = await supabase.from("apoderados").insert({ nombre, email, telefono });
    if (insertError) redirect(`/dashboard/usuarios?error=${encodeURIComponent(insertError.message)}`);
  }

  // Apoderado nunca tiene contraseña: el invite crea el usuario de auth y le
  // llega un primer magic link. Los siguientes ingresos piden uno nuevo
  // desde /login (ver pedirMagicLink en src/app/login/actions.ts).
  const admin = createAdminClient();
  const origin = await getOrigin();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nombre, rol: "apoderado" },
    redirectTo: `${origin}/auth/confirm?next=/dashboard`,
  });
  if (error) redirect(`/dashboard/usuarios?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard/usuarios");
  redirect("/dashboard/usuarios?ok=1");
}

export async function reenviarInvitacion(tabla: "entrenadores" | "apoderados", email: string): Promise<InvitarResultado> {
  await exigirDirectorOAdmin();
  const admin = createAdminClient();
  const origin = await getOrigin();
  const redirectTo = tabla === "entrenadores" ? `${origin}/auth/confirm?type=invite` : `${origin}/auth/confirm?next=/dashboard`;
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
