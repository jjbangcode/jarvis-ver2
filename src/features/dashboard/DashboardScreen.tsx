import { useState } from "react";
import type { CoreState } from "@/types/core";
import { DashboardShell } from "./DashboardShell";
import { TopBar } from "./TopBar";
import { DashboardBody } from "./DashboardBody";
import { ExecutionFooter } from "./ExecutionFooter";
import { CoreStatePreviewDev } from "./CoreStatePreviewDev";

export function DashboardScreen() {
  // TEMPORARY: dev-only state preview, see CoreStatePreviewDev.
  const [coreState, setCoreState] = useState<CoreState>("idle");

  return (
    <DashboardShell>
      <TopBar />
      <CoreStatePreviewDev value={coreState} onChange={setCoreState} />
      <DashboardBody coreState={coreState} />
      <ExecutionFooter />
    </DashboardShell>
  );
}
