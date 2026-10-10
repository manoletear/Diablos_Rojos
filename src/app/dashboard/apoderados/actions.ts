"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearApoderado(formData: FormData) {
  const supabase = await createClient();

  const { data: apoderado, error } = await supabase
    .from("apoderados")
    .insert({
      nombre: formData.get("nombre") as string,
      email: (formData.get("email") as string) || null,
      telefono: (formData.get("telefono") as string) || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const alumnoId = formData.get("alumno_id") as string;
  if (alumnoId) {
    await supabase.from("apoderado_alumno").insert({
      apoderado_id: apoderado.id,
      alumno_id: alumnoId,
      relacion: (formData.get("relacion") as string) || "tutor",
      es_principal: formData.get("es_principal") === "on",
    });
  }

  revalidatePath("/dashboard/apoderados");
  redirect("/dashboard/apoderados");
}

export async function actualizarApoderado(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("apoderados")
    .update({
      nombre: formData.get("nombre") as string,
      email: (formData.get("email") as string) || null,
      telefono: (formData.get("telefono") as string) || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/apoderados");
  redirect("/dashboard/apoderados");
}

export async function vincularAlumno(apoderadoId: string, formData: FormData) {
  const supabase = await createClient();
  const alumnoId = formData.get("alumno_id") as string;
  if (!alumnoId) return;

  const { error } = await supabase.from("apoderado_alumno").insert({
    apoderado_id: apoderadoId,
    alumno_id: alumnoId,
    relacion: (formData.get("relacion") as string) || "tutor",
    es_principal: formData.get("es_principal") === "on",
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/apoderados/${apoderadoId}/editar`);
}
