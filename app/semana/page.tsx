import type { Metadata } from "next";
import Header from "@/components/Header";
import ViewTabs from "@/components/ViewTabs";
import WeekView from "@/components/WeekView";

export const metadata: Metadata = {
  title: "Radar Personal — Semana",
};

export default function SemanaPage() {
  return (
    <div className="app-shell">
      <Header>
        <ViewTabs />
      </Header>
      <main className="page md:h-[calc(100dvh_-_var(--header-height))] md:overflow-hidden">
        <WeekView />
      </main>
    </div>
  );
}
