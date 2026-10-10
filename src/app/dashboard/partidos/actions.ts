"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearPartido(formData: FormData) {
  const supabase = await createClient();

  const categoria_id = formData.get("categoria_id") as string;
  const torneo_id = formData.get("torneo_id") as string;
  const rival = formData.get("rival") as string;
  const fecha = formData.get("fecha") as string;
  const hora = formData.get("hora") as string;
  const recintoNombre = formData.get("recinto") as string;
  const local_o_visita = formData.get("local_o_visita") as string;

  let recinto_id: string | null = null;
  if (recintoNombre?.trim()) {
    const { data: existente } = await supabase.from("recintos").select("id").eq("nombre", recintoNombre.trim()).maybeSingle();
    if (existente) {
      recinto_id = existente.id;
    } else {
      const { data: nuevo } = await supabase.from("recintos").insert({ nombre: recintoNombre.trim() }).select("id").single();
      recinto_id = nuevo?.id ?? null;
    }
  }

  const { error } = await supabase.from("partidos").insert({
    categoria_id,
    torneo_id: torneo_id || null,
    rival,
    fecha_hora: `${fecha}T${hora}:00`,
    recinto_id,
    local_o_visita,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/partidos");
  redirect("/dashboard/partidos");
}

export async function actualizarPartido(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("partidos")
    .update({
      rival: formData.get("rival") as string,
      fecha_hora: `${formData.get("fecha")}T${formData.get("hora")}:00`,
      local_o_visita: formData.get("local_o_visita") as string,
      estado: formData.get("estado") as string,
      resultado_local: formData.get("resultado_local") ? Number(formData.get("resultado_local")) : null,
      resultado_rival: formData.get("resultado_rival") ? Number(formData.get("resultado_rival")) : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/partidos/${id}`);
  revalidatePath("/dashboard/partidos");
}

async function getOrCrearConvocatoria(supabase: Awaited<ReturnType<typeof createClient>>, partidoId: string) {
  const { data: existente } = await supabase.from("convocatorias").select("id").eq("partido_id", partidoId).maybeSingle();
  if (existente) return existente.id;
  const { data: nueva, error } = await supabase.from("convocatorias").insert({ partido_id: partidoId }).select("id").single();
  if (error) throw new Error(error.message);
  return nueva.id;
}

export async function toggleConvocado(partidoId: string, alumnoId: string, convocar: boolean) {
  const supabase = await createClient();
  const convocatoriaId = await getOrCrearConvocatoria(supabase, partidoId);

  if (convocar) {
    const { error } = await supabase
      .from("convocatoria_jugadores")
      .upsert({ convocatoria_id: convocatoriaId, alumno_id: alumnoId, estado: "confirmada" }, { onConflict: "convocatoria_id,alumno_id" });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("convocatoria_jugadores")
      .delete()
      .eq("convocatoria_id", convocatoriaId)
      .eq("alumno_id", alumnoId);
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/dashboard/partidos/${partidoId}`);
}

export async function guardarLineup(partidoId: string, formData: FormData) {
  const supabase = await createClient();
  const formacion = formData.get("formacion") as string;

  const { error } = await supabase
    .from("lineups")
    .upsert({ partido_id: partidoId, formacion }, { onConflict: "partido_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/partidos/${partidoId}`);
}

export async function setTitular(partidoId: string, alumnoId: string, titular: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("minutajes_partido")
    .upsert({ partido_id: partidoId, alumno_id: alumnoId, titular }, { onConflict: "partido_id,alumno_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/partidos/${partidoId}`);
}

export async function iniciarEnVivo(partidoId: string) {
  const supabase = await createClient();
  await supabase.from("partido_estado_vivo").upsert(
    { partido_id: partidoId, estado: "primer_tiempo", iniciado_en: new Date().toISOString() },
    { onConflict: "partido_id" }
  );
  await supabase.from("partidos").update({ estado: "en_curso" }).eq("id", partidoId);
  revalidatePath(`/dashboard/partidos/${partidoId}`);
}

export async function finalizarEnVivo(partidoId: string) {
  const supabase = await createClient();
  await supabase.from("partido_estado_vivo").update({ estado: "finalizado" }).eq("partido_id", partidoId);
  await supabase.from("partidos").update({ estado: "completado" }).eq("id", partidoId);
  revalidatePath(`/dashboard/partidos/${partidoId}`);
}

export async function sumarGol(partidoId: string, equipo: "local" | "rival") {
  const supabase = await createClient();
  const { data: p } = await supabase.from("partidos").select("resultado_local, resultado_rival").eq("id", partidoId).single();
  const resultado_local = (p?.resultado_local ?? 0) + (equipo === "local" ? 1 : 0);
  const resultado_rival = (p?.resultado_rival ?? 0) + (equipo === "rival" ? 1 : 0);
  await supabase.from("partidos").update({ resultado_local, resultado_rival }).eq("id", partidoId);
  revalidatePath(`/dashboard/partidos/${partidoId}`);
}

export async function guardarEstadisticaJugador(partidoId: string, alumnoId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("minutajes_partido").upsert(
    {
      partido_id: partidoId,
      alumno_id: alumnoId,
      minutos_jugados: Number(formData.get("minutos_jugados") ?? 0),
      goles: Number(formData.get("goles") ?? 0),
      asistencias: Number(formData.get("asistencias") ?? 0),
      amarillas: Number(formData.get("amarillas") ?? 0),
      rojas: Number(formData.get("rojas") ?? 0),
      minutos_fuente: "manual",
    },
    { onConflict: "partido_id,alumno_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/partidos/${partidoId}`);
}
