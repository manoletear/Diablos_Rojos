"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function campos(formData: FormData) {
  return {
    nombre: formData.get("nombre") as string,
    sede_id: formData.get("sede_id") as string,
    anio_desde: Number(formData.get("anio_desde")),
    anio_hasta: Number(formData.get("anio_hasta")),
    dias_horario: (formData.get("dias_horario") as string) || null,
    mensualidad_base: formData.get("mensualidad_base") ? Number(formData.get("mensualidad_base")) : null,
    entrenador_principal_id: (formData.get("entrenador_principal_id") as string) || null,
    estado: formData.get("estado") as string,
  };
}

export async function crearCategoria(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert(campos(formData));
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/categorias");
  redirect("/dashboard/categorias");
}

export async function actualizarCategoria(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("categorias").update(campos(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/categorias");
  redirect("/dashboard/categorias");
}
