"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    // Solo se persiste cuando el usuario lo cambia a mano (regla del DS).
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="app-header">
      <h1 className="font-display text-lg text-default">Radar Personal</h1>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          className="icon-btn"
          data-plain="true"
          aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          onClick={toggleDark}
        >
          {mounted &&
            (dark ? (
              <Sun className="icon" aria-hidden="true" />
            ) : (
              <Moon className="icon" aria-hidden="true" />
            ))}
        </button>
        <button
          type="button"
          className="icon-btn"
          data-plain="true"
          aria-label="Cerrar sesión"
          onClick={() => void logout()}
        >
          <LogOut className="icon" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
