import { RuntimeStoreProvider } from "@/store/RuntimeStore";
import { useRuntimeStore } from "@/store/useRuntimeStore";
import { RuntimeScenarioDev } from "./RuntimeScenarioDev";
import { DashboardShell } from "./DashboardShell";
import { TopBar } from "./TopBar";
import { DashboardBody } from "./DashboardBody";
import { ExecutionFooter } from "./ExecutionFooter";

function DashboardScreenInner() {
  const { coreState, agents, scenario, setScenario } = useRuntimeStore();

  return (
    <DashboardShell>
      <TopBar />
      {/* TEMPORARY: dev-only scenario control, see RuntimeScenarioDev. */}
      <RuntimeScenarioDev value={scenario} onChange={setScenario} />
      <DashboardBody coreState={coreState} agents={agents} />
      <ExecutionFooter />
    </DashboardShell>
  );
}

export function DashboardScreen() {
  return (
    <RuntimeStoreProvider>
      <DashboardScreenInner />
    </RuntimeStoreProvider>
  );
}
