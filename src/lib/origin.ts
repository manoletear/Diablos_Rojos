import { headers } from "next/headers";

// Origen real de la request (host + protocolo) para construir redirectTo de
// invitaciones y magic links. Funciona igual en localhost y en producción
// detrás del proxy de Netlify.
export async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
