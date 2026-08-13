"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const OTP_LENGTH = 6; // Debe coincidir con "Email OTP length" en Supabase.

function friendlyAuthError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (msg.includes("rate limit")) {
    return "Se alcanzó el límite de correos por hora. No es una falla de la app: el correo de prueba de Supabase solo manda ~2 por hora. Espera un rato e intenta de nuevo.";
  }
  if (msg.includes("expired") || msg.includes("invalid")) {
    return "El código no es válido o ya venció. Pide uno nuevo e inténtalo otra vez.";
  }
  if (msg.includes("not allowed") || msg.includes("signup") || msg.includes("database error")) {
    return "Ese correo no tiene acceso a esta app.";
  }
  return "Algo falló al entrar. Intenta de nuevo en un momento.";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabase.current) supabase.current = createClient();

  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Entrada con contraseña: alternativa al código por correo mientras el
  // correo transaccional (Resend) no esté conectado. Auth estándar de
  // Supabase — mismo candado de allowlist, mismo RLS.
  async function signInWithPassword() {
    if (!email.trim() || !password) return;
    setVerifying(true);
    setError(null);
    const { error: err } = await supabase.current!.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setVerifying(false);
    if (err) {
      setError(friendlyAuthError(err.message));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function sendCode(): Promise<boolean> {
    setSending(true);
    setError(null);
    const { error: err } = await supabase.current!.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (err) {
      setError(friendlyAuthError(err.message));
      return false;
    }
    setNotice(null);
    setDigits(Array(OTP_LENGTH).fill(""));
    setStep("code");
    return true;
  }

  async function verifyCode(code: string) {
    setVerifying(true);
    setError(null);
    const { error: err } = await supabase.current!.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: "email",
    });
    setVerifying(false);
    if (err) {
      setError(friendlyAuthError(err.message));
      setDigits(Array(OTP_LENGTH).fill(""));
      boxRefs.current[0]?.focus();
      return;
    }
    router.replace("/");
    router.refresh();
  }

  function handleDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((prev) => prev.map((d, i) => (i === index ? "" : d)));
      return;
    }
    const next = [...digits];
    if (clean.length === 2 && digits[index] !== "") {
      // Corregir una casilla ya llena: quedarse SOLO con el dígito nuevo
      // (sin esto, el dígito viejo se corre a la casilla de al lado y se
      // puede auto-enviar un código corrupto).
      const newChar = clean[0] === digits[index] ? clean[1] : clean[0];
      next[index] = newChar;
      setDigits(next);
      boxRefs.current[index]?.focus();
      const full = next.join("");
      if (full.length === OTP_LENGTH && next.every((d) => d !== "")) {
        void verifyCode(full);
      }
      return;
    }
    // Pegar el código completo (o tecleo normal en casilla vacía).
    const chars = clean.slice(0, OTP_LENGTH - index).split("");
    chars.forEach((ch, offset) => {
      next[index + offset] = ch;
    });
    setDigits(next);
    const lastFilled = Math.min(index + chars.length, OTP_LENGTH - 1);
    boxRefs.current[lastFilled]?.focus();
    const code = next.join("");
    if (code.length === OTP_LENGTH && next.every((d) => d !== "")) {
      void verifyCode(code);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo local
            estático, no amerita el pipeline de next/image */}
        <img src="/logo.png" alt="" aria-hidden="true" className="h-14 w-auto" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-display text-2xl text-default">Radar Personal</h1>
          <p className="text-sm text-muted">Tu panel, siempre a la mano.</p>
        </div>
      </div>

      <div className="card flex w-full max-w-sm flex-col gap-4 p-4 md:p-6">
        {step === "email" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) void sendCode();
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="label-default" htmlFor="email">
                Tu correo
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                className="input-default"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="help-text">
                Te mandamos un código de {OTP_LENGTH} dígitos para entrar.
              </p>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button
              type="submit"
              className="btn-primary min-h-12 w-full"
              disabled={sending}
              data-loading={sending}
            >
              {sending ? "Enviando…" : "Mandarme el código"}
            </button>
            <button
              type="button"
              className="btn-tertiary min-h-12 w-full"
              onClick={() => {
                setStep("password");
                setError(null);
                setNotice(null);
              }}
            >
              Entrar con contraseña
            </button>
          </form>
        ) : step === "password" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void signInWithPassword();
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="label-default" htmlFor="email-pw">
                Tu correo
              </label>
              <input
                id="email-pw"
                type="email"
                required
                autoComplete="email"
                className="input-default"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-default" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                autoFocus
                className="input-default"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button
              type="submit"
              className="btn-primary min-h-12 w-full"
              disabled={verifying}
              data-loading={verifying}
            >
              {verifying ? "Entrando…" : "Entrar"}
            </button>
            <button
              type="button"
              className="btn-tertiary min-h-12 w-full"
              disabled={verifying}
              onClick={() => {
                setStep("email");
                setPassword("");
                setError(null);
              }}
            >
              Volver al código por correo
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="label-default">Revisa tu correo</p>
              <p className="text-sm text-muted">
                Te mandamos un código de {OTP_LENGTH} dígitos a{" "}
                <span className="font-semibold text-default">{email}</span>.
                Puede tardar un minuto en llegar.
              </p>
            </div>

            <div className="flex justify-between gap-2">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    boxRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Dígito ${i + 1} de ${OTP_LENGTH}`}
                  className="input-default num h-12 w-full max-w-12 text-center text-lg"
                  maxLength={OTP_LENGTH}
                  value={digit}
                  autoFocus={i === 0}
                  disabled={verifying}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>

            {verifying && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <span className="spinner" aria-hidden="true" /> Verificando…
              </p>
            )}
            {error && <p className="error-text">{error}</p>}
            {notice && <p className="help-text">{notice}</p>}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="btn-tertiary min-h-12 w-full"
                disabled={sending || verifying}
                onClick={() => {
                  void sendCode().then((ok) => {
                    if (ok) {
                      setNotice(
                        "Código reenviado. Ojo: el correo de prueba solo manda ~2 por hora."
                      );
                    }
                  });
                }}
              >
                {sending ? "Reenviando…" : "Reenviar código"}
              </button>
              <button
                type="button"
                className="btn-tertiary min-h-12 w-full"
                disabled={verifying}
                onClick={() => {
                  setStep("email");
                  setError(null);
                  setNotice(null);
                }}
              >
                Usar otro correo
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
