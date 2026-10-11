import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Topbar } from "@/components/topbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, rol, email")
    .eq("id", user.id)
    .single();

  let notificaciones: { id: string; cuerpo: string; created_at: string; leido_en: string | null }[] = [];
  if (profile?.rol === "apoderado") {
    const { data: apoderado } = await supabase.from("apoderados").select("id").eq("profile_id", user.id).maybeSingle();
    if (apoderado) {
      const { data: envios } = await supabase
        .from("mensaje_envios")
        .select("id, leido_en, created_at, mensajes(cuerpo_renderizado)")
        .eq("apoderado_id", apoderado.id)
        .eq("canal", "in_app")
        .order("created_at", { ascending: false })
        .limit(20);
      notificaciones = (envios ?? []).map((e) => ({
        id: e.id,
        cuerpo: (e.mensajes as unknown as { cuerpo_renderizado: string } | null)?.cuerpo_renderizado ?? "",
        created_at: e.created_at,
        leido_en: e.leido_en,
      }));
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden md:block">
        <Sidebar
          userEmail={profile?.email ?? user.email ?? ""}
          userRole={profile?.rol ?? "sin rol"}
        />
      </div>
      <div className="flex min-h-screen flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
        <Topbar
          userEmail={profile?.email ?? user.email ?? ""}
          userRole={profile?.rol ?? "sin rol"}
          notificaciones={notificaciones}
        />
        <main className="flex-1">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
