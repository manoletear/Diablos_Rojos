import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MODULOS = [
  { icon: "👥", title: "Alumnos", desc: "Ficha completa, categoría, estado de matrícula, ficha médica." },
  { icon: "✅", title: "Asistencia", desc: "Registro por categoría y fecha, resumen por alumno." },
  { icon: "💲", title: "Finanzas", desc: "Matrícula, mensualidad, estados de pago y balance en tiempo real." },
  { icon: "🏆", title: "Categorías", desc: "Sedes, horarios, rango de edad y alumnos por categoría." },
  { icon: "⚽", title: "Deportivo", desc: "Partidos, convocatorias, resultados y estadísticas." },
  { icon: "👪", title: "Apoderados", desc: "Relación familiar completa, varios hijos por cuenta." },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="DR Taktik" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold text-dr-neutral-900">DIABLOS ROJOS</span>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-primary-500 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          Iniciar sesión
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-10 text-center sm:px-10">
        <div className="mx-auto mb-6 w-fit rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600">
          Plataforma propia de gestión deportiva
        </div>
        <h1 className="text-4xl font-bold leading-tight text-dr-neutral-900 sm:text-5xl">
          Gestión de academia,
          <br />
          en un solo lugar.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-500">
          Alumnos, asistencia, pagos y partidos de Diablos Rojos — administrado
          directamente por el cuerpo técnico y la dirección del club.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
          {[
            { value: "200+", label: "Alumnos" },
            { value: "9", label: "Categorías" },
            { value: "370+", label: "Partidos registrados" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-neutral-200 bg-white px-4 py-5">
              <div className="text-2xl font-bold text-dr-neutral-900">{s.value}</div>
              <div className="mt-1 text-xs text-neutral-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Módulos */}
      <section className="mx-auto max-w-5xl px-6 pb-24 sm:px-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((m) => (
            <div
              key={m.title}
              className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="text-2xl">{m.icon}</div>
              <div className="mt-3 font-semibold text-dr-neutral-900">{m.title}</div>
              <div className="mt-1 text-sm text-neutral-500">{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 px-6 py-6 text-center text-xs text-neutral-400 sm:px-10">
        Diablos Rojos — uso interno del club.
      </footer>
    </div>
  );
}
