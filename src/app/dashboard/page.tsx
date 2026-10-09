import { createClient } from "@/lib/supabase/server";

async function getKpis() {
  const supabase = await createClient();

  const [{ count: activos }, { count: enPrueba }, { count: categorias }] =
    await Promise.all([
      supabase
        .from("alumnos")
        .select("*", { count: "exact", head: true })
        .eq("estado", "matriculado"),
      supabase
        .from("alumnos")
        .select("*", { count: "exact", head: true })
        .eq("estado", "en_prueba"),
      supabase
        .from("categorias")
        .select("*", { count: "exact", head: true })
        .eq("estado", "activa"),
    ]);

  return {
    activos: activos ?? 0,
    enPrueba: enPrueba ?? 0,
    categorias: categorias ?? 0,
  };
}

export default async function DashboardPage() {
  const kpis = await getKpis();

  const cards = [
    {
      label: "Estudiantes Activos",
      value: kpis.activos,
      sub: `${kpis.enPrueba} en prueba`,
    },
    { label: "Categorías Activas", value: kpis.categorias, sub: "" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
      <p className="text-sm text-neutral-500">Vista general de la academia</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="text-sm text-neutral-500">{c.label}</div>
            <div className="mt-1 text-3xl font-bold text-neutral-900">
              {c.value}
            </div>
            {c.sub && (
              <div className="mt-1 text-xs text-neutral-400">{c.sub}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
