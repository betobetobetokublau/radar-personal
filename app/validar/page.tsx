import type { Metadata } from "next";
import ValidarForm from "@/components/ValidarForm";

export const metadata: Metadata = {
  title: "Radar Personal — acceso anticipado",
  description:
    "Para freelancers que llevan varios clientes a la vez: pendientes, entregas y fechas en un solo tablero, siempre a la vista.",
};

export default function ValidarPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 md:gap-8">
      <div className="flex w-full max-w-lg flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo local
            estático, no amerita el pipeline de next/image */}
        <img src="/logo.png" alt="" aria-hidden="true" className="h-12 w-auto" />
        <h1 className="font-display text-2xl text-default">
          ¿Llevas 3 clientes o más… en un cuaderno?
        </h1>
        <p className="text-base text-muted">
          Radar Personal pone los pendientes, entregas y fechas de TODOS tus
          clientes en un solo tablero, siempre a la vista — en tu pared, tu
          compu y tu celular. Estamos abriendo el acceso poco a poco.
        </p>
      </div>

      <ValidarForm />

      <p className="help-text max-w-lg text-center">
        Sin spam: tu correo solo se usa para avisarte de tu acceso.
      </p>
    </main>
  );
}
