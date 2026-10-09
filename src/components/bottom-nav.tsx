"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "Inicio", href: "/dashboard", icon: "🏠" },
  { label: "Alumnos", href: "/dashboard/alumnos", icon: "👥" },
  { label: "Asistencia", href: "/dashboard/asistencias", icon: "✅" },
  { label: "Pagos", href: "/dashboard/finanzas", icon: "💲" },
  { label: "Más", href: "/dashboard/mas", icon: "☰" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-neutral-200 bg-white md:hidden">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
              active ? "text-red-700" : "text-neutral-500"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
