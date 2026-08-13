"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

// Espejo del regex del servidor (app/api/validar/route.ts).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Conversión del experimento de crecimiento (canal viral / grupos de
 * Facebook). Cada envío cae al tablero de raicode con module:"crecer" —
 * separado de las respuestas del módulo de validación.
 */
export default function CreceForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<"validacion" | "limite" | "conexion" | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const valid = EMAIL_RE.test(email.trim());

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  async function submit() {
    if (!valid || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          answer: "Registro desde landing /crece (experimento grupos de Facebook)",
          module: "crecer",
        }),
      });
      if (res.status === 400) {
        setError("validacion");
        return;
      }
      if (res.status === 429) {
        setError("limite");
        return;
      }
      if (!res.ok) throw new Error("collector error");
      setSent(true);
    } catch {
      setError("conexion");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className="card flex w-full max-w-lg flex-col items-center gap-3 p-4 text-center md:p-6"
      >
        <span
          aria-hidden="true"
          className="control-checked grid h-11 w-11 place-items-center rounded-full"
        >
          <Check size={20} strokeWidth={1.75} />
        </span>
        <p className="font-display text-lg text-default">
          ¡Listo! Te apartamos tu lugar.
        </p>
        <p className="text-sm text-muted">
          Te escribiremos a{" "}
          <span className="font-semibold text-default">{email.trim()}</span>{" "}
          para abrirte tu acceso.
        </p>
      </div>
    );
  }

  return (
    <form
      className="card flex w-full max-w-lg flex-col gap-3 p-4 md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="label-default" htmlFor="c-email">
          Tu correo
        </label>
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            id="c-email"
            type="email"
            required
            autoComplete="email"
            maxLength={200}
            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
            className={`input-default min-w-0 flex-1 ${error === "validacion" ? "input-error" : ""}`}
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary min-h-12 md:flex-none"
            disabled={!valid}
            data-loading={sending}
            aria-busy={sending}
          >
            {sending ? "Enviando…" : "Quiero mi acceso"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="error-text">
          {error === "validacion"
            ? "Revisa que tu correo sea válido (ej. nombre@dominio.com) e intenta de nuevo."
            : error === "limite"
              ? "Hay muchos envíos en este momento. Espera un minuto e intenta de nuevo."
              : "No se pudo enviar. Revisa tu conexión e intenta de nuevo."}
        </p>
      )}
    </form>
  );
}
