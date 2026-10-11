"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function guardarPushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw new Error(error.message);
}

export async function marcarNotificacionLeida(envioId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mensaje_envios")
    .update({ leido_en: new Date().toISOString() })
    .eq("id", envioId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
