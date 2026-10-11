"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearDocumentoTributario(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("documentos_tributarios").insert({
    tipo: formData.get("tipo") as string,
    direccion: formData.get("direccion") as string,
    folio: (formData.get("folio") as string) || null,
    rut_contraparte: (formData.get("rut_contraparte") as string) || null,
    razon_social_contraparte: (formData.get("razon_social_contraparte") as string) || null,
    monto_neto: formData.get("monto_neto") ? Number(formData.get("monto_neto")) : null,
    monto_iva: formData.get("monto_iva") ? Number(formData.get("monto_iva")) : null,
    monto_total: Number(formData.get("monto_total")),
    fecha_emision: formData.get("fecha_emision") as string,
    categoria_gasto: (formData.get("categoria_gasto") as string) || null,
    notas: (formData.get("notas") as string) || null,
    origen: "manual",
    creado_por: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/flujo-caja");
  redirect("/dashboard/flujo-caja");
}

export async function conciliarConPago(documentoId: string, formData: FormData) {
  const supabase = await createClient();
  const pagoId = formData.get("pago_id") as string;

  const { error } = await supabase
    .from("documentos_tributarios")
    .update({ pago_id: pagoId || null, estado: pagoId ? "conciliado" : "pendiente" })
    .eq("id", documentoId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/flujo-caja");
}

export async function anularDocumento(documentoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("documentos_tributarios").update({ estado: "anulado" }).eq("id", documentoId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/flujo-caja");
}
