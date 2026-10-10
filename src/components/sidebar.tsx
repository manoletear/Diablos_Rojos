"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV, isGroup, filterForRole, type Rol, type NavItem, type NavGroup } from "@/lib/nav";

export type { Rol };

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
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-4">
        <img src="/logo.png" alt="DR Taktik" className="h-9 w-9 object-contain" />
        <span className="text-sm font-bold tracking-wide text-dr-neutral-900">TAKTIK</span>
        <img src="/images/logo-nublense.png" alt="Club Ñublense" className="ml-auto h-8 w-8 object-contain" />
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
