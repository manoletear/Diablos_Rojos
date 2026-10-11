"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function campos(formData: FormData) {
  return {
    nombre: formData.get("nombre") as string,
    apellido: formData.get("apellido") as string,
    rut: (formData.get("rut") as string) || null,
    fecha_nacimiento: (formData.get("fecha_nacimiento") as string) || null,
    categoria_id: (formData.get("categoria_id") as string) || null,
    sede_id: (formData.get("sede_id") as string) || null,
    estado: formData.get("estado") as string,
    posicion: (formData.get("posicion") as string) || null,
    numero_camiseta: formData.get("numero_camiseta") ? Number(formData.get("numero_camiseta")) : null,
  };
}

export async function crearAlumno(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("alumnos").insert(campos(formData)).select("id").single();
  if (error) throw new Error(error.message);

  // registra la categoria principal en alumno_categorias (N:M)
  const categoria_id = formData.get("categoria_id") as string;
  if (categoria_id) {
    await supabase.from("alumno_categorias").insert({ alumno_id: data.id, categoria_id, es_principal: true });
  }

  revalidatePath("/dashboard/alumnos");
  redirect("/dashboard/alumnos");
}

export async function actualizarAlumno(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("alumnos").update(campos(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/alumnos");
  redirect("/dashboard/alumnos");
}

export async function crearMedicion(alumnoId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const peso_kg = Number(formData.get("peso_kg"));
  const talla_cm = Number(formData.get("talla_cm"));
  // IMC = peso(kg) / talla(m)^2. Percentiles OMS quedan sin calcular: la
  // tabla alumnos no tiene columna sexo todavia, y calcular_percentil_oms()
  // la necesita — no se inventa un valor.
  const talla_m = talla_cm / 100;
  const imc = talla_m > 0 ? Math.round((peso_kg / (talla_m * talla_m)) * 100) / 100 : null;

  const { error } = await supabase.from("mediciones_antropometricas").insert({
    alumno_id: alumnoId,
    fecha_medicion: formData.get("fecha_medicion") as string,
    peso_kg,
    talla_cm,
    imc,
    notas: (formData.get("notas") as string) || null,
    medido_por: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/alumnos/${alumnoId}/editar`);
}
