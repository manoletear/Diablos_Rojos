"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, provisionarUsuario } from "@/lib/supabase/admin";
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

function generarClaveAleatoria() {
  // 12 caracteres, alfanumérico + símbolo — suficiente para una clave que
  // el admin lee una vez y relaya a mano, no para memorizar.
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let clave = "";
  for (let i = 0; i < 12; i++) clave += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return clave + "!";
}

type ClaveEmergenciaResultado = { ok: boolean; password?: string; error?: string };

/**
 * Fallback cuando el correo (invite o magic link) no llega — pasó con
 * María José: invite nunca se abrió, mailer por defecto de Supabase no es
 * confiable sin SMTP propio (ver docs, RESEND_API_KEY pendiente). Genera
 * una clave real, la setea vía provisionarUsuario (que SIEMPRE confirma el
 * email — esa fue la causa real del bug), y la devuelve una sola vez para
 * que el admin la pase a mano. No queda guardada en ningún lado.
 */
export async function generarClaveEmergencia(tabla: "entrenadores" | "apoderados", filaId: string): Promise<ClaveEmergenciaResultado> {
  const supabase = await exigirDirectorOAdmin();
  const { data: fila } = await supabase.from(tabla).select("email, nombre, profile_id").eq("id", filaId).maybeSingle();
  if (!fila?.email) return { ok: false, error: "No se encontró esa fila." };

  const rol = tabla === "entrenadores" ? "entrenador" : "apoderado";
  const password = generarClaveAleatoria();

  try {
    await provisionarUsuario({ email: fila.email, nombre: fila.nombre, rol, profileId: fila.profile_id, password });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }

  revalidatePath("/dashboard/usuarios");
  return { ok: true, password };
}
