import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CUATRO_C = [
  { letra: "C", titulo: "Casa", texto: "La familia es la base de los hábitos, el apoyo emocional y los valores fundamentales del jugador. Sin una casa sólida, no hay formación completa." },
  { letra: "C", titulo: "Colegio", texto: "El rendimiento académico y la responsabilidad fuera de la cancha son pilares esenciales. Un buen estudiante es, ante todo, una persona comprometida." },
  { letra: "C", titulo: "Club", texto: "El espacio donde se entrena el compromiso con el equipo, el respeto por las normas y la pasión por el juego colectivo." },
  { letra: "C", titulo: "Consistencia", texto: "La clave que une todo: hacer las cosas bien todos los días. Sin consistencia, el talento no florece." },
];

const CUATRO_D = [
  { letra: "D", titulo: "Disciplina", texto: "Cumplir con las rutinas, los horarios y las exigencias del proceso. La disciplina es la base del crecimiento sostenido." },
  { letra: "D", titulo: "Dedicación", texto: "Entregarse al máximo en cada entrenamiento, cada partido y cada momento de aprendizaje. Sin dedicación no hay excelencia." },
  { letra: "D", titulo: "Deseo", texto: "La motivación interna que impulsa a mejorar cada día. El deseo de ser mejor es lo que marca la diferencia." },
  { letra: "D", titulo: "Determinación", texto: "La fuerza para enfrentar obstáculos, superar fracasos y seguir adelante. La determinación forja el carácter del jugador." },
];

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

  const { data: categorias } = await supabase
    .from("categorias")
    .select("nombre, anio_desde, anio_hasta, dias_horario, alumnos(count)")
    .eq("estado", "activa")
    .order("anio_desde", { ascending: false });

  return (
    <div className="min-h-screen bg-dr-neutral-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 sm:px-10">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Diablos Rojos" className="h-10 w-10 object-contain" />
          <span className="text-lg font-bold tracking-wide text-dr-neutral-900">DIABLOS ROJOS</span>
          <div className="h-8 w-px bg-neutral-200" />
          <img src="/images/logo-nublense.png" alt="Club Ñublense" className="h-10 w-10 object-contain" />
        </div>
        <Link
          href="/login"
          className="rounded-md bg-primary-500 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          Iniciar sesión
        </Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-20 text-center sm:px-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-diablos.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dr-neutral-900/20 via-dr-neutral-900/50 to-dr-neutral-900" />
        <div className="relative mx-auto max-w-4xl">
          <div className="mx-auto mb-5 w-fit rounded-full bg-primary-500/15 px-4 py-1.5 text-xs font-semibold text-primary-400">
            Academia oficial de Ñublense
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            Academia de Fútbol
            <br />
            <span className="text-primary-500">Diablos Rojos</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-300">
            No prometemos futbolistas profesionales, pero sí mejores ciudadanos.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Quienes somos */}
      <section className="bg-white px-6 py-16 text-dr-neutral-900 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-600">Quiénes Somos</div>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Más que una academia de fútbol, una comunidad formadora
            </h2>
            <div className="mt-6 space-y-5 text-neutral-600">
              <p>
                Diablos Rojos es la academia de fútbol formativo oficial de Ñublense, uno de
                los clubes más importantes de Chile. Nuestro enfoque va más allá de la técnica
                y la táctica: creemos firmemente que la persona viene antes que el jugador.
              </p>
              <p>
                La academia forma parte del prestigioso proyecto <strong>Método X</strong>,
                dirigido por Franco Illino y Gian Carlo Zolezzi, dos referentes del fútbol
                formativo en Chile. Trabajamos alineados con los lineamientos de la ANFP para
                fútbol formativo y alto rendimiento.
              </p>
              <p className="font-medium text-dr-neutral-900">
                La cancha es una excusa para enseñar valores que duran toda la vida.
              </p>
            </div>
          </div>
          <img
            src="/images/about-diablos.jpg"
            alt="Jugadores de Academia Diablos Rojos entrenando"
            className="rounded-xl object-cover shadow-lg"
          />
        </div>
      </section>

      {/* Filosofia 4C/4D */}
      <section className="bg-neutral-50 px-6 py-16 text-dr-neutral-900 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-600">Nuestra Filosofía</div>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Las 4C y las 4D</h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-neutral-400">Las 4C</h3>
              <div className="space-y-4">
                {CUATRO_C.map((p) => (
                  <div key={p.titulo} className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                      {p.letra}
                    </div>
                    <div>
                      <div className="font-semibold">{p.titulo}</div>
                      <div className="text-sm text-neutral-500">{p.texto}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-neutral-400">Las 4D</h3>
              <div className="space-y-4">
                {CUATRO_D.map((p) => (
                  <div key={p.titulo} className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-dr-neutral-900 text-sm font-bold text-white">
                      {p.letra}
                    </div>
                    <div>
                      <div className="font-semibold">{p.titulo}</div>
                      <div className="text-sm text-neutral-500">{p.texto}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias reales */}
      {categorias && categorias.length > 0 && (
        <section className="bg-white px-6 py-16 text-dr-neutral-900 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary-600">Categorías y Edades</div>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Encuentra la categoría perfecta para tu hijo</h2>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorias.map((c) => {
                const n = (c.alumnos as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
                const rango = c.anio_desde === c.anio_hasta ? `${c.anio_desde}` : `${c.anio_desde} – ${c.anio_hasta}`;
                return (
                  <div key={c.nombre} className="rounded-xl border border-neutral-200 p-5">
                    <div className="font-bold text-dr-neutral-900">{c.nombre}</div>
                    <div className="mt-1 text-xs text-neutral-400">{rango}</div>
                    <div className="mt-2 text-sm text-neutral-500">{c.dias_horario}</div>
                    <div className="mt-3 text-xs font-medium text-primary-600">{n} alumnos matriculados</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Modulos de la plataforma */}
      <section className="bg-dr-neutral-900 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-400">Plataforma propia</div>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Gestión de academia, en un solo lugar</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULOS.map((m) => (
              <div key={m.title} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="text-2xl">{m.icon}</div>
                <div className="mt-3 font-semibold">{m.title}</div>
                <div className="mt-1 text-sm text-neutral-400">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-neutral-500 sm:px-10">
        Diablos Rojos — Academia oficial de Ñublense — uso interno del club.
      </footer>
    </div>
  );
}
