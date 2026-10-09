"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function guardarAsistencia(formData: FormData) {
  const categoriaId = formData.get("categoria_id") as string;
  const fecha = formData.get("fecha") as string;
  const alumnoIds = formData.getAll("alumno_id") as string[];

  const supabase = await createClient();

  const { data: sesion, error: sesionError } = await supabase
    .from("sesiones_entrenamiento")
    .upsert(
      { categoria_id: categoriaId, fecha },
      { onConflict: "categoria_id,fecha" }
    )
    .select("id")
    .single();

  if (sesionError || !sesion) {
    throw new Error(sesionError?.message ?? "No se pudo crear la sesión");
  }

  const registros = alumnoIds.map((alumnoId) => ({
    sesion_id: sesion.id,
    alumno_id: alumnoId,
    estado: (formData.get(`estado_${alumnoId}`) as string) || "ausente",
  }));

  const { error: upsertError } = await supabase
    .from("registros_asistencia")
    .upsert(registros, { onConflict: "sesion_id,alumno_id" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  revalidatePath("/dashboard/asistencias");
}
