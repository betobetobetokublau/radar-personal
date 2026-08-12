import Header from "@/components/Header";
import InstallHint from "@/components/InstallHint";
import Panel from "@/components/Panel";

export default function Home() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page has-bottom-nav">
        <InstallHint />
        <Panel />
      </main>
    </div>
  );
}
