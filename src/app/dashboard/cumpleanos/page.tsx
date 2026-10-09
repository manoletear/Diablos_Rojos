import { createClient } from "@/lib/supabase/server";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function edad(fechaNacimiento: string) {
  const fn = new Date(fechaNacimiento);
  const hoy = new Date();
  let e = hoy.getFullYear() - fn.getFullYear();
  const m = hoy.getMonth() - fn.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) e--;
  return e;
}

export default async function CumpleanosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; rango?: string }>;
}) {
  const sp = await searchParams;
  const rango = sp.rango === "hoy" ? "hoy" : sp.rango === "mes" ? "mes" : "semana";

  const supabase = await createClient();

  const [{ data: categorias }, { data: alumnosRaw }] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase
      .from("alumnos")
      .select("id, nombre, apellido, fecha_nacimiento, categoria_id, categorias(nombre), apoderado_alumno(count)")
      .eq("estado", "matriculado")
      .not("fecha_nacimiento", "is", null),
  ]);

  const now = new Date();
  let cumples = (alumnosRaw ?? [])
    .map((a) => {
      const fn = new Date(a.fecha_nacimiento as string);
      const next = new Date(now.getFullYear(), fn.getMonth(), fn.getDate());
      if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        next.setFullYear(now.getFullYear() + 1);
      }
      const dias = Math.round((next.getTime() - now.getTime()) / 86400000);
      return {
        ...a,
        dias,
        edadNueva: edad(a.fecha_nacimiento as string) + 1,
        fechaTexto: `${fn.getDate()} de ${MESES[fn.getMonth()]} de ${fn.getFullYear()}`,
        apoderadosCount: (a.apoderado_alumno as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
      };
    })
    .sort((a, b) => a.dias - b.dias);

  if (sp.q) {
    const q = sp.q.toLowerCase();
    cumples = cumples.filter((c) => `${c.nombre} ${c.apellido}`.toLowerCase().includes(q));
  }
  if (sp.categoria) {
    cumples = cumples.filter((c) => c.categoria_id === sp.categoria);
  }

  const hoyCount = cumples.filter((c) => c.dias === 0).length;
  const semanaCount = cumples.filter((c) => c.dias <= 7).length;
  const mesCount = cumples.filter((c) => c.dias <= 31).length;

  const visibles =
    rango === "hoy" ? cumples.filter((c) => c.dias === 0) : rango === "mes" ? cumples.filter((c) => c.dias <= 31) : cumples.filter((c) => c.dias <= 7);

  function hrefCon(params: Record<string, string | undefined>) {
    const usp = new URLSearchParams();
    const merged = { q: sp.q, categoria: sp.categoria, rango, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) usp.set(k, v);
    return `/dashboard/cumpleanos?${usp.toString()}`;
  }

  return (
    <div className="p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">🎂 Cumpleaños</h1>
      <p className="text-sm text-neutral-500">Gestiona los cumpleaños de tus estudiantes</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="text-3xl font-bold text-neutral-900">{hoyCount}</div>
          <div className="text-sm text-neutral-500">Hoy</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="text-3xl font-bold text-neutral-900">{semanaCount}</div>
          <div className="text-sm text-neutral-500">Esta semana</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="text-3xl font-bold text-neutral-900">{mesCount}</div>
          <div className="text-sm text-neutral-500">Este mes</div>
        </div>
      </div>

      <form method="get" className="mt-4 flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white p-4">
        <input type="hidden" name="rango" value={rango} />
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar estudiante..."
          className="min-w-[260px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <select name="categoria" defaultValue={sp.categoria ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="">Todas las categorías</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-dr-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-dr-neutral-800">
          Buscar
        </button>
      </form>

      <div className="mt-4 flex overflow-hidden rounded-lg border border-neutral-200 text-sm">
        <a href={hrefCon({ rango: "hoy" })} className={`flex-1 px-4 py-2 text-center font-medium ${rango === "hoy" ? "bg-primary-50 text-primary-600" : "bg-neutral-50 text-neutral-500"}`}>
          🎉 Hoy ({hoyCount})
        </a>
        <a href={hrefCon({ rango: "semana" })} className={`flex-1 px-4 py-2 text-center font-medium ${rango === "semana" ? "bg-primary-50 text-primary-600" : "bg-neutral-50 text-neutral-500"}`}>
          📅 Semana ({semanaCount})
        </a>
        <a href={hrefCon({ rango: "mes" })} className={`flex-1 px-4 py-2 text-center font-medium ${rango === "mes" ? "bg-primary-50 text-primary-600" : "bg-neutral-50 text-neutral-500"}`}>
          🎁 Mes ({mesCount})
        </a>
      </div>

      <div className="mt-4 space-y-3">
        {visibles.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-400">
            Sin cumpleaños en este rango.
          </div>
        )}
        {visibles.map((c) => {
          const cat = (c.categorias as unknown as { nombre: string } | null)?.nombre;
          return (
            <div key={c.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-600">
                    {c.nombre[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">{c.nombre} {c.apellido}</div>
                    <div className="text-sm text-neutral-500">Cumple {c.edadNueva} años — {c.fechaTexto}</div>
                  </div>
                </div>
                <span className="rounded-full bg-warning-bg px-3 py-1 text-xs font-medium text-warning">
                  {c.dias === 0 ? "Hoy" : `En ${c.dias} días`}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {cat && <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">{cat}</span>}
                <span className="rounded bg-success-bg px-2 py-0.5 text-xs text-success">
                  {c.apoderadosCount} apoderado{c.apoderadosCount === 1 ? "" : "s"}
                </span>
              </div>
              <button
                disabled
                title="Módulo Comunicación pendiente de construir"
                className="mt-3 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-400"
              >
                Generar Mensaje
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
