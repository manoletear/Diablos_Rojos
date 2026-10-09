import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function money(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

async function getData() {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [
    { count: activos },
    { count: enPrueba },
    { count: categoriasActivas },
    { count: entrenadores },
    { count: temporadas },
    { data: pagos },
    { data: alumnosCumple },
  ] = await Promise.all([
    supabase.from("alumnos").select("*", { count: "exact", head: true }).eq("estado", "matriculado"),
    supabase.from("alumnos").select("*", { count: "exact", head: true }).eq("estado", "en_prueba"),
    supabase.from("categorias").select("*", { count: "exact", head: true }).eq("estado", "activa"),
    supabase.from("entrenadores").select("*", { count: "exact", head: true }),
    supabase.from("temporadas").select("*", { count: "exact", head: true }),
    supabase.from("pagos").select("estado, monto_total, monto_pagado"),
    supabase.from("alumnos").select("id, nombre, apellido, fecha_nacimiento, categorias(nombre)").not("fecha_nacimiento", "is", null),
  ]);

  const resumenPagos = (pagos ?? []).reduce(
    (acc, p) => {
      acc[p.estado] = (acc[p.estado] ?? 0) + 1;
      acc.totalGenerado += Number(p.monto_total);
      acc.totalRecaudado += Number(p.monto_pagado);
      return acc;
    },
    {
      pendiente: 0,
      parcial: 0,
      por_comprobar: 0,
      pagado: 0,
      vencido: 0,
      totalGenerado: 0,
      totalRecaudado: 0,
    } as Record<string, number>
  );
  const balancePendiente = resumenPagos.totalGenerado - resumenPagos.totalRecaudado;
  const pagosConSaldo = (pagos ?? []).filter((p) => p.estado !== "pagado").length;

  // Cumpleaños próximos (hoy + 14 días)
  const now = new Date();
  const cumples = (alumnosCumple ?? [])
    .map((a) => {
      const fn = new Date(a.fecha_nacimiento as string);
      const next = new Date(now.getFullYear(), fn.getMonth(), fn.getDate());
      if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        next.setFullYear(now.getFullYear() + 1);
      }
      const dias = Math.round((next.getTime() - now.getTime()) / 86400000);
      return { ...a, dias };
    })
    .filter((a) => a.dias <= 14)
    .sort((a, b) => a.dias - b.dias);
  const cumpleHoy = cumples.filter((c) => c.dias === 0).length;
  const cumpleSemana = cumples.filter((c) => c.dias <= 7).length;

  // Asistencia y pagos: alumnos presentes HOY con pago pendiente/vencido
  const { data: sesionesHoy } = await supabase
    .from("sesiones_entrenamiento")
    .select("id")
    .eq("fecha", hoy);
  const sesionIds = (sesionesHoy ?? []).map((s) => s.id);
  let alumnosDeuda: { nombre: string; apellido: string }[] = [];
  if (sesionIds.length > 0) {
    const { data: presentesHoy } = await supabase
      .from("registros_asistencia")
      .select("alumno_id, alumnos(nombre, apellido)")
      .in("sesion_id", sesionIds)
      .eq("estado", "presente");
    const idsPresentes = (presentesHoy ?? []).map((r) => r.alumno_id);
    if (idsPresentes.length > 0) {
      const { data: deudores } = await supabase
        .from("pagos")
        .select("alumno_id, alumnos(nombre, apellido)")
        .in("alumno_id", idsPresentes)
        .in("estado", ["pendiente", "vencido"]);
      const vistos = new Set<string>();
      for (const d of deudores ?? []) {
        if (!vistos.has(d.alumno_id)) {
          vistos.add(d.alumno_id);
          const al = d.alumnos as unknown as { nombre: string; apellido: string } | null;
          if (al) alumnosDeuda.push(al);
        }
      }
    }
  }

  return {
    activos: activos ?? 0,
    enPrueba: enPrueba ?? 0,
    categoriasActivas: categoriasActivas ?? 0,
    entrenadores: entrenadores ?? 0,
    temporadas: temporadas ?? 0,
    resumenPagos,
    balancePendiente,
    pagosConSaldo,
    cumples,
    cumpleHoy,
    cumpleSemana,
    alumnosDeuda,
  };
}

export default async function DashboardPage() {
  const d = await getData();

  const pasos = [
    { label: "Crear primera temporada", done: d.temporadas > 0, href: "#" },
    { label: "Importar estudiantes", done: d.activos + d.enPrueba > 0, href: "/dashboard/alumnos" },
    { label: "Configurar organización", done: false, href: "#" },
    { label: "Conectar integraciones", done: false, href: "#" },
  ];
  const pasosCompletados = pasos.filter((p) => p.done).length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
      <p className="text-sm text-neutral-500">Vista general de la academia</p>

      {pasosCompletados < pasos.length && (
        <div className="mt-6 rounded-xl border border-info bg-info-bg p-5">
          <div className="font-semibold text-neutral-900">🎯 Configuración Inicial</div>
          <div className="mt-1 text-sm text-neutral-600">
            Completa estos pasos para aprovechar al máximo el sistema
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
            <span>Progreso general</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium">
              {pasosCompletados} de {pasos.length} completados
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full bg-info"
              style={{ width: `${(pasosCompletados / pasos.length) * 100}%` }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {pasos.map((p) => (
              <div
                key={p.label}
                className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm"
              >
                <span className={p.done ? "text-success" : "text-neutral-700"}>
                  {p.done ? "✅" : "⬜"} {p.label}
                </span>
                {!p.done && p.href !== "#" && (
                  <Link href={p.href} className="text-xs font-medium text-primary-600">
                    Ir →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Estudiantes Activos</div>
          <div className="mt-1 text-3xl font-bold text-neutral-900">{d.activos}</div>
          <div className="mt-1 text-xs text-neutral-400">{d.enPrueba} en prueba</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Categorías</div>
          <div className="mt-1 text-3xl font-bold text-neutral-900">{d.categoriasActivas}</div>
          <div className="mt-1 text-xs text-neutral-400">Categorías activas</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Entrenadores</div>
          <div className="mt-1 text-3xl font-bold text-neutral-900">{d.entrenadores}</div>
          <div className="mt-1 text-xs text-neutral-400">Personal técnico</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Balance Pendiente</div>
          <div className="mt-1 text-3xl font-bold text-error">{money(d.balancePendiente)}</div>
          <div className="mt-1 text-xs text-neutral-400">{d.pagosConSaldo} pagos</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Resumen de pagos */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-neutral-900">Resumen de Pagos</div>
            <Link href="/dashboard/finanzas" className="text-sm font-medium text-primary-600">
              Ver Todos
            </Link>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Generado</span>
              <span className="font-semibold">{money(d.resumenPagos.totalGenerado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Recaudado</span>
              <span className="font-semibold text-success">{money(d.resumenPagos.totalRecaudado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Balance Pendiente</span>
              <span className="font-semibold text-error">{money(d.balancePendiente)}</span>
            </div>
          </div>
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <div className="text-xs font-medium uppercase text-neutral-400">Estado de Pagos</div>
            <div className="mt-2 space-y-1.5 text-sm">
              {(["pendiente", "parcial", "vencido", "pagado"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="capitalize text-neutral-600">{k}</span>
                  <span className="font-medium">{d.resumenPagos[k]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cumpleaños */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-neutral-900">🎂 Cumpleaños</div>
            <Link href="/dashboard/cumpleanos" className="text-sm font-medium text-primary-600">
              Ver todos →
            </Link>
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="rounded-full bg-primary-50 px-2 py-0.5 font-medium text-primary-600">{d.cumpleHoy} hoy</span>
            <span className="rounded-full bg-info-bg px-2 py-0.5 font-medium text-info">{d.cumpleSemana} esta semana</span>
          </div>
          <div className="mt-4 space-y-2">
            {d.cumples.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-neutral-900">{c.nombre} {c.apellido}</div>
                  <div className="text-xs text-neutral-400">
                    {(c.categorias as unknown as { nombre: string } | null)?.nombre}
                  </div>
                </div>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  {c.dias === 0 ? "Hoy" : `En ${c.dias} días`}
                </span>
              </div>
            ))}
            {d.cumples.length === 0 && (
              <div className="text-sm text-neutral-400">Sin cumpleaños próximos.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Alertas antropométricas - modulo Salud aun no implementado (Fase 3) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="font-semibold text-neutral-900">⚠️ Alertas Antropométricas</div>
          <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
            Módulo Salud (mediciones + alertas) pendiente de construir — Fase 3 del plan.
          </div>
        </div>

        {/* Asistencia y Pagos - real */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="font-semibold text-neutral-900">Asistencia y Pagos</div>
          <div className="mt-4 space-y-2">
            {d.alumnosDeuda.length > 0 ? (
              d.alumnosDeuda.map((a, i) => (
                <div key={i} className="text-sm text-neutral-700">
                  {a.nombre} {a.apellido} — asistió hoy, tiene deuda
                </div>
              ))
            ) : (
              <div className="text-sm text-neutral-400">
                No hay alumnos con deuda que hayan asistido hoy
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Próximos partidos - modulo Deportivo aun no implementado (Fase 4) */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Próximos Partidos</div>
        <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
          Módulo Deportivo (partidos, convocatorias, torneos) pendiente de construir — Fase 4 del plan.
        </div>
      </div>

      {/* Acciones rapidas */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="font-semibold text-neutral-900">Acciones Rápidas</div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard/alumnos"
            className="rounded-md border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Gestionar Estudiantes
          </Link>
          <Link
            href="/dashboard/finanzas"
            className="rounded-md border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Generar Pagos Mensuales
          </Link>
          <span className="cursor-not-allowed rounded-md border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium text-neutral-400">
            Crear Partido (Fase 4)
          </span>
        </div>
      </div>
    </div>
  );
}
