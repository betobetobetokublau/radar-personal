import type { Metadata } from "next";
import Header from "@/components/Header";
import ViewTabs from "@/components/ViewTabs";
import HabitosManager from "@/components/HabitosManager";

export const metadata: Metadata = {
  title: "Radar Personal — Hábitos",
};

export default function HabitosPage() {
  return (
    <div className="app-shell">
      <Header>
        <ViewTabs />
      </Header>
      <main className="page">
        <HabitosManager />
      </main>
    </div>
  );
}
