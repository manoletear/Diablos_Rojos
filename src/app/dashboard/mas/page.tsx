import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NAV, isGroup, filterForRole, type Rol } from "@/lib/nav";

export default async function MasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, email")
    .eq("id", user!.id)
    .single();

  const role: Rol = (["director", "admin", "entrenador", "apoderado"] as const).includes(
    profile?.rol as Rol
  )
    ? (profile!.rol as Rol)
    : "apoderado";

  const nav = filterForRole(NAV, role);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Más</h1>
      <p className="text-sm text-neutral-500">Todas las secciones de la plataforma</p>

      <div className="mt-6 space-y-6">
        {nav.map((item) =>
          isGroup(item) ? (
            <div key={item.label}>
              <div className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {item.label}
              </div>
              <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {item.items.map((sub, i) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={`flex items-center justify-between px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 ${
                      i > 0 ? "border-t border-neutral-100" : ""
                    }`}
                  >
                    {sub.label}
                    <span className="text-neutral-300">›</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div key={item.href} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <Link
                href={item.href}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {item.label}
                <span className="text-neutral-300">›</span>
              </Link>
            </div>
          )
        )}
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
        {profile?.email} · <span className="capitalize">{role}</span>
      </div>
    </div>
  );
}
