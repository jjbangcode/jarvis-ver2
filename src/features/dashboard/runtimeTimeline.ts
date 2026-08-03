import type { CoreState } from "@/types/core";
import type { AgentRun } from "@/types/dashboard";

export interface RuntimeKeyframe {
  readonly atMs: number;
  readonly coreState: CoreState;
  readonly agents: readonly AgentRun[];
}

/**
 * MOCK fixture — a scripted keyframe timeline standing in for a real-time
 * feed until S6 wires an actual orchestrator. `runtimeSimulation.ts` steps
 * through this list by elapsed time (looping every RUNTIME_CYCLE_MS) and
 * interpolates progress for whichever agent is mid-"loading", so the whole
 * pipeline reads as one continuous live run: dispatch, parallel retrieval,
 * ontology resolution, reranking, answer synthesis, a validation failure
 * and retry, then a successful completion before resetting to idle.
 *
 * Each const below is the agent's state as of that phase; keyframes reuse
 * the const for any agent that didn't change in that step.
 */

// --- orchestrator -----------------------------------------------------
const orchestratorQueued: AgentRun = {
  id: "orchestrator",
  number: 1,
  name: "Orchestrator",
  status: "queued",
  activity: "Queued for execution",
  logs: [],
  progress: null,
  startedAt: null,
  endedAt: null,
  error: null,
};
const orchestratorRunning1: AgentRun = {
  ...orchestratorQueued,
  status: "running",
  activity: "Coordinating agent pipeline",
  logs: ["Received structured command"],
  startedAt: "2026-08-02T09:12:03Z",
};
const orchestratorRunning2: AgentRun = {
  ...orchestratorRunning1,
  logs: ["Received structured command", "Dispatched retrieval tasks"],
};
const orchestratorRunning3: AgentRun = {
  ...orchestratorRunning2,
  logs: ["Received structured command", "Dispatched retrieval tasks", "Awaiting reranking output"],
};

// --- semantic-retrieval -------------------------------------------------
const semanticQueued: AgentRun = {
  id: "semantic-retrieval",
  number: 2,
  name: "Semantic Retrieval Agent",
  status: "waiting",
  activity: "Waiting on orchestrator dispatch",
  logs: [],
  progress: null,
  startedAt: null,
  endedAt: null,
  error: null,
};
const semanticRunning: AgentRun = {
  ...semanticQueued,
  status: "running",
  activity: "Querying embedding index",
  logs: ["Queried embedding index"],
  startedAt: "2026-08-02T09:12:04Z",
};
const semanticCompleted: AgentRun = {
  ...semanticRunning,
  status: "completed",
  activity: "Vector search complete",
  logs: ["Queried embedding index", "42 candidates retrieved", "Handed off to reranker"],
  progress: 100,
  endedAt: "2026-08-02T09:12:09Z",
};

// --- lexical-retrieval ---------------------------------------------------
const lexicalQueued: AgentRun = {
  id: "lexical-retrieval",
  number: 3,
  name: "Lexical Retrieval Agent",
  status: "waiting",
  activity: "Waiting on orchestrator dispatch",
  logs: [],
  progress: null,
  startedAt: null,
  endedAt: null,
  error: null,
};
const lexicalRunning: AgentRun = {
  ...lexicalQueued,
  status: "running",
  activity: "Querying inverted index",
  logs: ["Queried inverted index"],
  startedAt: "2026-08-02T09:12:04Z",
};
const lexicalCompleted: AgentRun = {
  ...lexicalRunning,
  status: "completed",
  activity: "BM25 search complete",
  logs: ["Queried inverted index", "37 candidates retrieved"],
  progress: 100,
  endedAt: "2026-08-02T09:12:08Z",
};

// --- ontology ----------------------------------------------------------
const ontologyQueued: AgentRun = {
  id: "ontology",
  number: 4,
  name: "Ontology Agent",
  status: "queued",
  activity: "Queued for execution",
  logs: [],
  progress: null,
  startedAt: null,
  endedAt: null,
  error: null,
};
/** Progress here is the ramp start; runtimeSimulation interpolates it toward 100 as the next keyframe nears. */
const ontologyLoading: AgentRun = {
  ...ontologyQueued,
  status: "loading",
  activity: "Resolving term hierarchy",
  logs: ["Loaded biomedical ontology graph"],
  progress: 0,
  startedAt: "2026-08-02T09:12:09Z",
};
const ontologyCompleted: AgentRun = {
  ...ontologyLoading,
  status: "completed",
  activity: "Term hierarchy resolved",
  logs: ["Loaded biomedical ontology graph", "Mapped entities to UMLS concepts"],
  progress: 100,
  endedAt: "2026-08-02T09:12:14Z",
};

// --- re-ranking ----------------------------------------------------------
const rerankingWaiting: AgentRun = {
  id: "re-ranking",
  number: 5,
  name: "Re-ranking Agent",
  status: "waiting",
  activity: "Waiting on retrieval agents",
  logs: [],
  progress: null,
  startedAt: null,
  endedAt: null,
  error: null,
};
const rerankingRunning: AgentRun = {
  ...rerankingWaiting,
  status: "running",
  activity: "Reranking candidate set",
  logs: ["Merged retrieval candidates"],
  startedAt: "2026-08-02T09:12:14Z",
};
const rerankingCompleted: AgentRun = {
  ...rerankingRunning,
  status: "completed",
  activity: "Reranking complete",
  logs: ["Merged retrieval candidates", "Top-8 passages selected"],
  progress: 100,
  endedAt: "2026-08-02T09:12:17Z",
};

// --- llm-reasoning -------------------------------------------------------
const llmQueued: AgentRun = {
  id: "llm-reasoning",
  number: 6,
  name: "LLM Reasoning Agent",
  status: "queued",
  activity: "Queued for execution",
  logs: [],
  progress: null,
  startedAt: null,
  endedAt: null,
  error: null,
};
const llmRunning: AgentRun = {
  ...llmQueued,
  status: "running",
  activity: "Synthesizing answer",
  logs: ["Loaded context window"],
  startedAt: "2026-08-02T09:12:17Z",
};
const llmCompleted: AgentRun = {
  ...llmRunning,
  status: "completed",
  activity: "Answer draft generated",
  logs: ["Loaded context window", "Draft ready for validation"],
  progress: 100,
  endedAt: "2026-08-02T09:12:20Z",
};

// --- validation ----------------------------------------------------------
const validationQueued: AgentRun = {
  id: "validation",
  number: 7,
  name: "Validation Agent",
  status: "queued",
  activity: "Queued for execution",
  logs: [],
  progress: null,
  startedAt: null,
  endedAt: null,
  error: null,
};
const validationRunning: AgentRun = {
  ...validationQueued,
  status: "running",
  activity: "Validating draft answer",
  logs: ["Received draft answer"],
  startedAt: "2026-08-02T09:12:20Z",
};
const validationError: AgentRun = {
  ...validationRunning,
  status: "error",
  activity: "Schema validation failed",
  logs: ["Received draft answer", "Missing citation for claim #2"],
  endedAt: "2026-08-02T09:12:21Z",
  error: "Validation schema mismatch: missing required field 'citations'",
};
const validationRetrying: AgentRun = {
  ...validationRunning,
  activity: "Re-validating with citations",
  logs: ["Received draft answer", "Missing citation for claim #2", "Retrying with citation fix"],
  endedAt: null,
  error: null,
};
const validationCompleted: AgentRun = {
  ...validationRetrying,
  status: "completed",
  activity: "Validation passed",
  logs: ["Retrying with citation fix", "Citations verified"],
  progress: 100,
  endedAt: "2026-08-02T09:12:24Z",
};

export const RUNTIME_CYCLE_MS = 24000;

export const RUNTIME_TIMELINE: readonly RuntimeKeyframe[] = [
  {
    atMs: 0,
    coreState: "idle",
    agents: [orchestratorQueued, semanticQueued, lexicalQueued, ontologyQueued, rerankingWaiting, llmQueued, validationQueued],
  },
  {
    atMs: 1500,
    coreState: "listening",
    agents: [orchestratorRunning1, semanticQueued, lexicalQueued, ontologyQueued, rerankingWaiting, llmQueued, validationQueued],
  },
  {
    atMs: 3000,
    coreState: "processing",
    agents: [orchestratorRunning2, semanticRunning, lexicalRunning, ontologyQueued, rerankingWaiting, llmQueued, validationQueued],
  },
  {
    atMs: 5000,
    coreState: "processing",
    agents: [orchestratorRunning2, semanticCompleted, lexicalCompleted, ontologyLoading, rerankingWaiting, llmQueued, validationQueued],
  },
  {
    atMs: 8000,
    coreState: "processing",
    agents: [orchestratorRunning3, semanticCompleted, lexicalCompleted, ontologyCompleted, rerankingRunning, llmQueued, validationQueued],
  },
  {
    atMs: 10500,
    coreState: "processing",
    agents: [orchestratorRunning3, semanticCompleted, lexicalCompleted, ontologyCompleted, rerankingCompleted, llmRunning, validationQueued],
  },
  {
    atMs: 13500,
    coreState: "processing",
    agents: [orchestratorRunning3, semanticCompleted, lexicalCompleted, ontologyCompleted, rerankingCompleted, llmCompleted, validationRunning],
  },
  {
    atMs: 15500,
    coreState: "error",
    agents: [orchestratorRunning3, semanticCompleted, lexicalCompleted, ontologyCompleted, rerankingCompleted, llmCompleted, validationError],
  },
  {
    atMs: 17000,
    coreState: "processing",
    agents: [orchestratorRunning3, semanticCompleted, lexicalCompleted, ontologyCompleted, rerankingCompleted, llmCompleted, validationRetrying],
  },
  {
    atMs: 18500,
    coreState: "completed",
    agents: [orchestratorRunning3, semanticCompleted, lexicalCompleted, ontologyCompleted, rerankingCompleted, llmCompleted, validationCompleted],
  },
  {
    atMs: 20000,
    coreState: "speaking",
    agents: [orchestratorRunning3, semanticCompleted, lexicalCompleted, ontologyCompleted, rerankingCompleted, llmCompleted, validationCompleted],
  },
  {
    atMs: 22000,
    coreState: "idle",
    agents: [orchestratorQueued, semanticQueued, lexicalQueued, ontologyQueued, rerankingWaiting, llmQueued, validationQueued],
  },
];
