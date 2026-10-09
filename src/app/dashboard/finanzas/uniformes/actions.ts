"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearPedidoUniforme(formData: FormData) {
  const supabase = await createClient();

  const alumno_id = formData.get("alumno_id") as string;
  const numero_camiseta = formData.get("numero_camiseta") as string;
  const talla_camiseta = formData.get("talla_camiseta") as string;
  const talla_short = formData.get("talla_short") as string;
  const motivo = formData.get("motivo") as string;
  const pago_requerido = formData.get("pago_requerido") === "on";

  const { data: alumno } = await supabase.from("alumnos").select("categoria_id").eq("id", alumno_id).single();
  const { data: config } = await supabase.from("configuracion_financiera").select("uniforme_precio").eq("id", true).single();

  let pago_id: string | null = null;
  const monto = pago_requerido ? config?.uniforme_precio ?? null : null;

  if (pago_requerido && monto) {
    const { data: pago } = await supabase
      .from("pagos")
      .insert({
        alumno_id,
        tipo: "uniforme",
        periodo: null,
        monto_total: monto,
        estado: "pendiente",
        fecha_vencimiento: null,
      })
      .select("id")
      .single();
    pago_id = pago?.id ?? null;
  }

  const { error } = await supabase.from("uniforme_pedidos").insert({
    alumno_id,
    categoria_id: alumno?.categoria_id ?? null,
    numero_camiseta: numero_camiseta ? Number(numero_camiseta) : null,
    talla_camiseta: talla_camiseta || null,
    talla_short: talla_short || null,
    motivo,
    pago_requerido,
    pago_id,
    monto,
    estado: pago_requerido ? "pendiente_pago" : "pagado",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/finanzas/uniformes");
  redirect("/dashboard/finanzas/uniformes");
}
