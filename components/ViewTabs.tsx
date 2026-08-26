"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VIEWS = [
  { href: "/", label: "Listas" },
  { href: "/semana", label: "Semana" },
  { href: "/mes", label: "Mes" },
];

/** Navegación principal entre vistas (Listas | Semana | Mes). */
export default function ViewTabs() {
  const pathname = usePathname();
  return (
    <nav className="segmented" aria-label="Vista del panel">
      {VIEWS.map((v) => {
        const active = pathname === v.href;
        return (
          <Link
            key={v.href}
            href={v.href}
            className="segment"
            aria-current={active ? "page" : undefined}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
