import type { AgentPlaceholder } from "@/types/dashboard";

/** Static agent roster (number + name only) for the S1 layout placeholder. */
export const AGENT_ROSTER: readonly AgentPlaceholder[] = [
  { id: "orchestrator", index: 1, name: "Orchestrator" },
  { id: "semantic-retrieval", index: 2, name: "Semantic Retrieval Agent" },
  { id: "lexical-retrieval", index: 3, name: "Lexical Retrieval Agent" },
  { id: "ontology", index: 4, name: "Ontology Agent" },
  { id: "re-ranking", index: 5, name: "Re-ranking Agent" },
  { id: "llm-reasoning", index: 6, name: "LLM Reasoning Agent" },
  { id: "validation", index: 7, name: "Validation Agent" },
];
