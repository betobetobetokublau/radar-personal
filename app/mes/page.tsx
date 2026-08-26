import type { Metadata } from "next";
import Header from "@/components/Header";
import ViewTabs from "@/components/ViewTabs";
import MonthView from "@/components/MonthView";

export const metadata: Metadata = {
  title: "Radar Personal — Mes",
};

export default function MesPage() {
  return (
    <div className="app-shell">
      <Header>
        <ViewTabs />
      </Header>
      <main className="page md:h-[calc(100dvh_-_var(--header-height))] md:overflow-hidden">
        <MonthView />
      </main>
    </div>
  );
}
