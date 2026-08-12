"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Puerta de prueba SOLO para desarrollo local (QA sin gastar el límite de
 * correos de OTP). En el build de producción esta ruta devuelve 404:
 * NODE_ENV se fija en compilación, así que el gate no depende del runtime.
 */
export default function DevLoginPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DevLoginForm />;
}

function DevLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setError(err.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={submit} className="card flex w-full max-w-sm flex-col gap-3 p-6">
        <h1 className="font-display text-lg text-default">Dev login (solo local)</h1>
        <input
          className="input-default"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-default"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn-primary">
          Entrar
        </button>
      </form>
    </main>
  );
}
