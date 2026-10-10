"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearPago(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("pagos").insert({
    alumno_id: formData.get("alumno_id") as string,
    tipo: formData.get("tipo") as string,
    periodo: (formData.get("periodo") as string) || null,
    monto_total: Number(formData.get("monto_total")),
    estado: "pendiente",
    fecha_vencimiento: (formData.get("fecha_vencimiento") as string) || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/finanzas");
  redirect("/dashboard/finanzas");
}

export async function registrarAbono(pagoId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("pagos_transacciones").insert({
    pago_id: pagoId,
    monto: Number(formData.get("monto")),
    metodo_pago: (formData.get("metodo_pago") as string) || null,
    estado_aprobacion: "aprobado",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/finanzas");
  revalidatePath(`/dashboard/finanzas/${pagoId}`);
}
