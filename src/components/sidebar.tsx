"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type Rol = "director" | "admin" | "entrenador" | "apoderado";

type NavItem = { label: string; href: string; roles: Rol[] };
type NavGroup = { label: string; items: NavItem[] };

// Visibilidad por rol. RLS en Supabase ya filtra los DATOS; esto filtra
// la UI para no mostrar secciones administrativas a quien no las gestiona.
const NAV: (NavItem | NavGroup)[] = [
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
      { label: "Reporte Asistencias", href: "/dashboard/asistencias/reporte", roles: ["director", "admin"] },
      { label: "Dashboard Ejecutivo", href: "/dashboard/ejecutivo", roles: ["director", "admin"] },
    ],
  },
  { label: "Finanzas", href: "/dashboard/finanzas", roles: ["director", "admin", "apoderado"] },
  { label: "Salud", href: "/dashboard/salud", roles: ["director", "admin"] },
  { label: "Comunicación", href: "/dashboard/comunicacion", roles: ["director", "admin"] },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

function filterForRole(nav: (NavItem | NavGroup)[], role: Rol) {
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

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={`block rounded-md px-3 py-2 text-sm ${
        active
          ? "bg-primary-50 font-medium text-primary-600"
          : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {item.label}
    </Link>
  );
}

function NavGroupBlock({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400"
      >
        {group.label}
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  userEmail,
  userRole,
}: {
  userEmail: string;
  userRole: string;
}) {
  const role: Rol = (["director", "admin", "entrenador", "apoderado"] as const).includes(
    userRole as Rol
  )
    ? (userRole as Rol)
    : "apoderado"; // rol desconocido -> acceso minimo, nunca admin por defecto

  const nav = filterForRole(NAV, role);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-4">
        <img src="/logo.png" alt="DR Taktik" className="h-9 w-9 object-contain" />
        <span className="text-sm font-bold tracking-wide text-dr-neutral-900">DIABLOS ROJOS</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) =>
          isGroup(item) ? (
            <NavGroupBlock key={item.label} group={item} />
          ) : (
            <NavLink key={item.href} item={item} />
          )
        )}
      </nav>
      <div className="border-t border-neutral-200 p-3 text-xs text-neutral-500">
        <div className="truncate">{userEmail}</div>
        <div className="capitalize text-neutral-400">{role}</div>
      </div>
    </aside>
  );
}
