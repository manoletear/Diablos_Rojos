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

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      } catch {
        // localStorage no disponible (privado/bloqueado), solo pierde la preferencia
      }
      return next;
    });
  }

  if (collapsed) {
    return (
      <aside className="flex h-screen w-14 flex-col items-center border-r border-neutral-200 bg-white py-3">
        <button
          onClick={toggle}
          aria-label="Mostrar menú"
          className="rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <img src="/images/logo-taktik.png" alt="DR Taktik" className="mt-4 h-8 w-auto object-contain" />
      </aside>
    );
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3">
        <img src="/images/logo-taktik.png" alt="DR Taktik" className="h-12 w-auto object-contain" />
        <img src="/images/logo-nublense.png" alt="Club Ñublense" className="ml-auto h-8 w-8 object-contain" />
        <button
          onClick={toggle}
          aria-label="Esconder menú"
          className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
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
