import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

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

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden md:block">
        <Sidebar
          userEmail={profile?.email ?? user.email ?? ""}
          userRole={profile?.rol ?? "sin rol"}
        />
      </div>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
