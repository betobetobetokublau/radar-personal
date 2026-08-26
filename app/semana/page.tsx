import type { Metadata } from "next";
import SemanaShell from "@/components/SemanaShell";

export const metadata: Metadata = {
  title: "Radar Personal — Semana",
};

export default function SemanaPage() {
  return <SemanaShell />;
}
