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
