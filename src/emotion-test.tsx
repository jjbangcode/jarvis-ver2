import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EmotionAgentTest } from "@/features/agents/EmotionAgentTest";
import "@/styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EmotionAgentTest />
  </StrictMode>,
);
