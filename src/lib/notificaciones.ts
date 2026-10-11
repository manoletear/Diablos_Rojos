import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:soporte@diablosrojoscl.com";

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

export type ResumenEnvio = { enviados: number; fallidos: number; motivoFallo?: string };
export type ResumenNotificacion = { inApp: ResumenEnvio; push: ResumenEnvio; email: ResumenEnvio };

type ApoderadoDestino = { id: string; profile_id: string | null; email: string | null };

export async function enviarNotificacionesMensaje(
  supabase: SupabaseClient,
  mensajeId: string,
  cuerpo: string,
  alumnoId: string
): Promise<ResumenNotificacion> {
  const resumen: ResumenNotificacion = {
    inApp: { enviados: 0, fallidos: 0 },
    push: { enviados: 0, fallidos: 0 },
    email: { enviados: 0, fallidos: 0 },
  };

  const { data: apoderados } = await supabase
    .from("apoderado_alumno")
    .select("apoderados(id, profile_id, email)")
    .eq("alumno_id", alumnoId);

  const destinos = ((apoderados ?? []) as unknown as { apoderados: ApoderadoDestino | null }[])
    .map((r) => r.apoderados)
    .filter((a): a is ApoderadoDestino => !!a);

  for (const apoderado of destinos) {
    // In-app: siempre se entrega, es solo una fila visible en la campanita de la app.
    const { error: errInApp } = await supabase.from("mensaje_envios").insert({
      mensaje_id: mensajeId,
      apoderado_id: apoderado.id,
      canal: "in_app",
      estado: "entregado",
      entregado_en: new Date().toISOString(),
    });
    if (errInApp) resumen.inApp.fallidos++;
    else resumen.inApp.enviados++;

    // Push: requiere suscripcion previa del apoderado en ese navegador/dispositivo.
    if (apoderado.profile_id && vapidPublic && vapidPrivate) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("profile_id", apoderado.profile_id);

      if (subs && subs.length > 0) {
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({ title: "Diablos Rojos", body: cuerpo })
            );
            await supabase.from("mensaje_envios").insert({
              mensaje_id: mensajeId,
              apoderado_id: apoderado.id,
              canal: "push",
              estado: "enviado",
              enviado_en: new Date().toISOString(),
            });
            resumen.push.enviados++;
          } catch (e) {
            await supabase.from("mensaje_envios").insert({
              mensaje_id: mensajeId,
              apoderado_id: apoderado.id,
              canal: "push",
              estado: "fallido",
              fallo_motivo: e instanceof Error ? e.message : "Error enviando push",
            });
            resumen.push.fallidos++;
            resumen.push.motivoFallo = "Error enviando push";
          }
        }
      } else {
        await supabase.from("mensaje_envios").insert({
          mensaje_id: mensajeId,
          apoderado_id: apoderado.id,
          canal: "push",
          estado: "fallido",
          fallo_motivo: "Sin suscripción push activa",
        });
        resumen.push.fallidos++;
        resumen.push.motivoFallo = "Sin suscripción activa";
      }
    } else {
      resumen.push.fallidos++;
      resumen.push.motivoFallo = "Push no configurado";
    }

    // Email: pendiente de proveedor (Resend) — se deja honestamente marcado como fallido/no conectado.
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && apoderado.email) {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM ?? "Diablos Rojos <notificaciones@diablosrojoscl.com>",
            to: [apoderado.email],
            subject: "Diablos Rojos — Nueva notificación",
            text: cuerpo,
          }),
        });
        if (!resp.ok) throw new Error(`Resend respondió ${resp.status}`);
        await supabase.from("mensaje_envios").insert({
          mensaje_id: mensajeId,
          apoderado_id: apoderado.id,
          canal: "email",
          estado: "enviado",
          enviado_en: new Date().toISOString(),
        });
        resumen.email.enviados++;
      } catch (e) {
        await supabase.from("mensaje_envios").insert({
          mensaje_id: mensajeId,
          apoderado_id: apoderado.id,
          canal: "email",
          estado: "fallido",
          fallo_motivo: e instanceof Error ? e.message : "Error enviando email",
        });
        resumen.email.fallidos++;
        resumen.email.motivoFallo = "Error enviando email";
      }
    } else {
      await supabase.from("mensaje_envios").insert({
        mensaje_id: mensajeId,
        apoderado_id: apoderado.id,
        canal: "email",
        estado: "fallido",
        fallo_motivo: "Resend no conectado",
      });
      resumen.email.fallidos++;
      resumen.email.motivoFallo = "Resend no conectado";
    }
  }

  return resumen;
}
