"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

// Espejo del regex del servidor (app/api/validar/route.ts): si difieren,
// un correo sin punto ("maria@gmail") pasaría el navegador y moriría en
// el servidor con un mensaje que no ayuda.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ValidarForm() {
  const [email, setEmail] = useState("");
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<"validacion" | "conexion" | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const valid = emailValid && answer.trim().length > 0;

  // Al confirmar, el foco aterriza en la tarjeta de gracias — para que
  // lectores de pantalla y teclado no queden en el vacío al desmontar el form.
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
        body: JSON.stringify({ email: email.trim(), answer: answer.trim() }),
      });
      if (res.status === 400) {
        setError("validacion");
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
          ¡Gracias! Quedaste en la lista.
        </p>
        <p className="text-sm text-muted">
          Te escribiremos a{" "}
          <span className="font-semibold text-default">{email.trim()}</span>{" "}
          cuando tu acceso esté listo.
        </p>
      </div>
    );
  }

  return (
    <form
      className="card flex w-full max-w-lg flex-col gap-4 p-4 md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="label-default" htmlFor="v-email">
          Tu correo
        </label>
        <input
          id="v-email"
          type="email"
          required
          autoComplete="email"
          maxLength={200}
          pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
          className={`input-default ${error === "validacion" ? "input-error" : ""}`}
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="label-default" htmlFor="v-answer">
          Hoy, ¿cómo llevas los pendientes y fechas de todos tus clientes — y
          qué fue lo último que se te escapó?
        </label>
        <textarea
          id="v-answer"
          required
          maxLength={2000}
          className="input-default min-h-28 resize-y"
          placeholder="Cuéntanos tal cual: cuaderno, notas del celular, memoria… y qué se te ha caído por llevarlo así."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <p className="help-text">
          Tu respuesta real nos ayuda a construir lo correcto.
        </p>
      </div>

      {error && (
        <p role="alert" className="error-text">
          {error === "validacion"
            ? "Revisa que tu correo sea válido (ej. nombre@dominio.com) e intenta de nuevo."
            : "No se pudo enviar. Revisa tu conexión e intenta de nuevo."}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary min-h-12 w-full"
        disabled={!valid}
        data-loading={sending}
        aria-busy={sending}
      >
        {sending ? "Enviando…" : "Quiero mi acceso"}
      </button>
    </form>
  );
}
