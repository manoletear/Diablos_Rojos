import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function EntrenadorHome({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: entrenador } = await supabase.from("entrenadores").select("id, nombre").eq("profile_id", userId).maybeSingle();

  if (!entrenador) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Bienvenido</h1>
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">
            Tu cuenta todavía no está vinculada a ninguna categoría. Contacta al director para que te asignen.
          </p>
        </div>
      </div>
    );
  }

  const { data: asignaciones } = await supabase
    .from("entrenador_categorias")
    .select("categoria_id, categorias(id, nombre, anio_desde, anio_hasta)")
    .eq("entrenador_id", entrenador.id);

  const categorias = (asignaciones ?? [])
    .map((a) => a.categorias as unknown as { id: string; nombre: string; anio_desde: number; anio_hasta: number } | null)
    .filter((c): c is NonNullable<typeof c> => !!c);
  const categoriaIds = categorias.map((c) => c.id);

  const [{ count: totalAlumnos }, { data: proximoPartido }, { data: sesionHoy }] = await Promise.all([
    categoriaIds.length > 0
      ? supabase.from("alumnos").select("*", { count: "exact", head: true }).in("categoria_id", categoriaIds).eq("estado", "matriculado")
      : Promise.resolve({ count: 0 }),
    categoriaIds.length > 0
      ? supabase.from("partidos").select("id, rival, fecha_hora, categorias(nombre)").in("categoria_id", categoriaIds).gte("fecha_hora", new Date().toISOString()).order("fecha_hora", { ascending: true }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    categoriaIds.length > 0
      ? supabase.from("sesiones_entrenamiento").select("id, categoria_id, categorias(nombre)").in("categoria_id", categoriaIds).eq("fecha", new Date().toISOString().slice(0, 10))
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Hola, {entrenador.nombre.split(" ")[0]}</h1>
      <p className="text-sm text-neutral-500">Tus categorías en Diablos Rojos</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Alumnos matriculados</div>
          <div className="mt-1 text-3xl font-bold text-neutral-900">{totalAlumnos ?? 0}</div>
          <div className="mt-1 text-xs text-neutral-400">en tus categorías</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Categorías a cargo</div>
          <div className="mt-1 text-3xl font-bold text-neutral-900">{categorias.length}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Entrenamientos hoy</div>
          <div className="mt-1 text-3xl font-bold text-neutral-900">{sesionHoy?.length ?? 0}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="font-semibold text-neutral-900">Tus categorías</div>
          <div className="mt-4 space-y-2">
            {categorias.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm">
                <span className="font-medium text-neutral-800">{c.nombre}</span>
                <Link href={`/dashboard/alumnos?categoria=${c.id}`} className="text-xs font-medium text-primary-600">Ver alumnos</Link>
              </div>
            ))}
            {categorias.length === 0 && <div className="text-sm text-neutral-400">Sin categorías asignadas.</div>}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="font-semibold text-neutral-900">Próximo partido</div>
          <div className="mt-4">
            {proximoPartido ? (
              <div className="rounded-md bg-neutral-50 px-3 py-2 text-sm">
                <div className="font-medium text-neutral-800">
                  {(proximoPartido.categorias as unknown as { nombre: string } | null)?.nombre} vs {proximoPartido.rival}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  {new Date(proximoPartido.fecha_hora).toLocaleDateString("es-CL")}{" "}
                  {new Date(proximoPartido.fecha_hora).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <Link href={`/dashboard/partidos/${proximoPartido.id}`} className="mt-2 inline-block text-xs font-medium text-primary-600">
                  Gestionar partido →
                </Link>
              </div>
            ) : (
              <div className="text-sm text-neutral-400">Sin partidos programados.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Acciones rápidas</div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/dashboard/asistencias" className="rounded-md border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Tomar asistencia
          </Link>
          <Link href="/dashboard/partidos" className="rounded-md border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Ver partidos
          </Link>
          <Link href="/dashboard/minutaje" className="rounded-md border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Ver minutaje
          </Link>
        </div>
      </div>
    </div>
  );
}
