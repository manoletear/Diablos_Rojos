"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { label: string; href: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: (NavItem | NavGroup)[] = [
  { label: "Inicio", href: "/dashboard" },
  {
    label: "Academia",
    items: [
      { label: "Alumnos", href: "/dashboard/alumnos" },
      { label: "Categorías", href: "/dashboard/categorias" },
      { label: "Apoderados", href: "/dashboard/apoderados" },
      { label: "Cumpleaños", href: "/dashboard/cumpleanos" },
    ],
  },
  {
    label: "Deportivo",
    items: [
      { label: "Partidos", href: "/dashboard/partidos" },
      { label: "Tablero de Partidos", href: "/dashboard/partidos/tablero" },
      { label: "Minutaje", href: "/dashboard/minutaje" },
      { label: "Torneos", href: "/dashboard/torneos" },
      { label: "Calendario", href: "/dashboard/calendario" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { label: "Asistencias", href: "/dashboard/asistencias" },
      { label: "Reporte Asistencias", href: "/dashboard/asistencias/reporte" },
      { label: "Dashboard Ejecutivo", href: "/dashboard/ejecutivo" },
    ],
  },
  { label: "Finanzas", href: "/dashboard/finanzas" },
  { label: "Salud", href: "/dashboard/salud" },
  { label: "Comunicación", href: "/dashboard/comunicacion" },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
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
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-2 bg-primary-500 px-4 py-4 text-white">
        <span className="text-lg font-bold">Diablos Rojos</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) =>
          isGroup(item) ? (
            <NavGroupBlock key={item.label} group={item} />
          ) : (
            <NavLink key={item.href} item={item} />
          )
        )}
      </nav>
      <div className="border-t border-neutral-200 p-3 text-xs text-neutral-500">
        <div className="truncate">{userEmail}</div>
        <div className="capitalize text-neutral-400">{userRole}</div>
      </div>
    </aside>
  );
}
