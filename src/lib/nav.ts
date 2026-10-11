export type Rol = "director" | "admin" | "entrenador" | "apoderado";

export type NavItem = { label: string; href: string; roles: Rol[] };
export type NavGroup = { label: string; items: NavItem[] };

// Visibilidad por rol. RLS en Supabase ya filtra los DATOS; esto filtra
// la UI para no mostrar secciones administrativas a quien no las gestiona.
export const NAV: (NavItem | NavGroup)[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    roles: ["director", "admin", "entrenador", "apoderado"],
  },
  {
    label: "Academia",
    items: [
      { label: "Alumnos", href: "/dashboard/alumnos", roles: ["director", "admin", "entrenador"] },
      { label: "Categorías", href: "/dashboard/categorias", roles: ["director", "admin", "entrenador"] },
      { label: "Apoderados", href: "/dashboard/apoderados", roles: ["director", "admin"] },
      { label: "Cumpleaños", href: "/dashboard/cumpleanos", roles: ["director", "admin", "entrenador"] },
    ],
  },
  {
    label: "Deportivo",
    items: [
      { label: "Partidos", href: "/dashboard/partidos", roles: ["director", "admin", "entrenador"] },
      { label: "Tablero de Partidos", href: "/dashboard/partidos/tablero", roles: ["director", "admin", "entrenador"] },
      { label: "Minutaje", href: "/dashboard/minutaje", roles: ["director", "admin", "entrenador"] },
      { label: "Torneos", href: "/dashboard/torneos", roles: ["director", "admin", "entrenador"] },
      { label: "Calendario", href: "/dashboard/calendario", roles: ["director", "admin", "entrenador", "apoderado"] },
    ],
  },
  {
    label: "Gestión",
    items: [
      { label: "Asistencias", href: "/dashboard/asistencias", roles: ["director", "admin", "entrenador"] },
      // Reporte Asistencias y Dashboard Ejecutivo: sin pagina construida
      // todavia (/dashboard/asistencias/reporte y /dashboard/ejecutivo
      // 404). Mismo criterio que Salud/Comunicacion abajo.
    ],
  },
  {
    label: "Finanzas",
    items: [
      { label: "Pagos", href: "/dashboard/finanzas", roles: ["director", "admin", "apoderado"] },
      { label: "Uniformes", href: "/dashboard/finanzas/uniformes", roles: ["director", "admin", "apoderado"] },
      { label: "Flujo de Caja", href: "/dashboard/flujo-caja", roles: ["director", "admin"] },
    ],
  },
  // Salud y Comunicación: tablas + RLS ya existen en Supabase, pero no
  // tienen UI construida todavía (/dashboard/salud y /dashboard/comunicacion
  // no existen = 404). Sacados del nav hasta tener la página real; no borrar
  // esta nota al construirlas, solo agregar el item de vuelta.
];

export function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

export function filterForRole(nav: (NavItem | NavGroup)[], role: Rol) {
  return nav
    .map((item) => {
      if (isGroup(item)) {
        const items = item.items.filter((i) => i.roles.includes(role));
        return items.length > 0 ? { ...item, items } : null;
      }
      return item.roles.includes(role) ? item : null;
    })
    .filter((x): x is NavItem | NavGroup => x !== null);
}
