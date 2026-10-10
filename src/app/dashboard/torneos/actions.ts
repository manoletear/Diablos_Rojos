"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearTorneo(formData: FormData) {
  const supabase = await createClient();

  const nombre = formData.get("nombre") as string;
  const tipo = formData.get("tipo") as string;
  const fecha_inicio = formData.get("fecha_inicio") as string;
  const fecha_fin = formData.get("fecha_fin") as string;
  const precioRaw = formData.get("precio") as string;
  const obligatorio = formData.get("obligatorio") === "on";
  const requiere_aprobacion = formData.get("requiere_aprobacion") === "on";
  const categoriaIds = formData.getAll("categoria_id") as string[];

  const { data: torneo, error } = await supabase
    .from("torneos")
    .insert({
      nombre,
      tipo,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      precio: precioRaw ? Number(precioRaw) : null,
      obligatorio,
      requiere_aprobacion,
    })
    .select("id")
    .single();

  if (error || !torneo) {
    throw new Error(error?.message ?? "No se pudo crear el torneo");
  }

  if (categoriaIds.length > 0) {
    await supabase
      .from("torneo_categorias")
      .insert(categoriaIds.map((categoria_id) => ({ torneo_id: torneo.id, categoria_id })));
  }

  revalidatePath("/dashboard/torneos");
  redirect("/dashboard/torneos");
}

export async function actualizarTorneo(id: string, formData: FormData) {
  const supabase = await createClient();

  const precioRaw = formData.get("precio") as string;
  const categoriaIds = formData.getAll("categoria_id") as string[];

  const { error } = await supabase
    .from("torneos")
    .update({
      nombre: formData.get("nombre") as string,
      tipo: formData.get("tipo") as string,
      fecha_inicio: (formData.get("fecha_inicio") as string) || null,
      fecha_fin: (formData.get("fecha_fin") as string) || null,
      estado: formData.get("estado") as string,
      precio: precioRaw ? Number(precioRaw) : null,
      obligatorio: formData.get("obligatorio") === "on",
      requiere_aprobacion: formData.get("requiere_aprobacion") === "on",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("torneo_categorias").delete().eq("torneo_id", id);
  if (categoriaIds.length > 0) {
    await supabase.from("torneo_categorias").insert(categoriaIds.map((categoria_id) => ({ torneo_id: id, categoria_id })));
  }

  revalidatePath("/dashboard/torneos");
  redirect("/dashboard/torneos");
}

export async function eliminarTorneo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("torneos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/torneos");
}
