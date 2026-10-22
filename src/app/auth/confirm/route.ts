import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Callback único para invite (profesor invitado por un admin) y magiclink
// (apoderado). Supabase manda token_hash + type en el link del correo.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const destino = type === "invite" ? "/auth/set-password" : next;
      return NextResponse.redirect(`${origin}${destino}`);
    }
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("El link expiró o ya fue usado. Pide uno nuevo.")}`);
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Link inválido.")}`);
}
