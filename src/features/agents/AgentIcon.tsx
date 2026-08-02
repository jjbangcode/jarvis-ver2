interface AgentIconProps {
  /** Agent number (1-based); picks one of 8 code-based glyphs, cycling if higher. */
  readonly number: number;
  readonly className?: string;
}

const SHARED_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Hub-and-spoke: orchestrator coordinating other nodes. */
function OrchestratorGlyph() {
  return (
    <svg {...SHARED_PROPS}>
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="12" cy="4" r="1.6" />
      <circle cx="19.5" cy="9" r="1.6" />
      <circle cx="16.5" cy="19" r="1.6" />
      <circle cx="4.5" cy="9" r="1.6" />
      <path d="M12 6.4V9.6M13.9 10.6l4-1.3M13.3 13.9l2.4 3.6M10.7 13.9l-2.4 3.6M10.1 10.6l-4-1.3" />
    </svg>
  );
}

/** Clustered nodes: semantic/embedding-space similarity. */
function SemanticGlyph() {
  return (
    <svg {...SHARED_PROPS}>
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="16" cy="14" r="2.4" />
      <circle cx="8" cy="17" r="1.8" />
      <path d="M11.2 10.1l3.2 2.3M7.5 10.5l-0.1 4.8" />
    </svg>
  );
}

/** Text lines + magnifier: lexical/keyword search. */
function LexicalGlyph() {
  return (
    <svg {...SHARED_PROPS}>
      <path d="M4 5h11M4 9h11M4 13h6" />
      <circle cx="16" cy="16" r="3.4" />
      <path d="M18.4 18.4L21 21" />
    </svg>
  );
}

/** Branching tree: ontology hierarchy. */
function OntologyGlyph() {
  return (
    <svg {...SHARED_PROPS}>
      <circle cx="12" cy="4.5" r="1.7" />
      <circle cx="5" cy="19" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
      <circle cx="19" cy="19" r="1.7" />
      <path d="M12 6.2V12M12 12L5 17.3M12 12v5.3M12 12l7 5.3" />
    </svg>
  );
}

/** Descending bars + arrows: re-ranking/sort. */
function RerankingGlyph() {
  return (
    <svg {...SHARED_PROPS}>
      <path d="M8 6h11M8 12h8M8 18h5" />
      <path d="M4 5v13M4 5l-2 2.4M4 5l2 2.4M4 18l-2-2.4M4 18l2-2.4" />
    </svg>
  );
}

/** Circuit hexagon: LLM reasoning. */
function ReasoningGlyph() {
  return (
    <svg {...SHARED_PROPS}>
      <path d="M12 3.5l7 4v9l-7 4-7-4v-9z" />
      <circle cx="12" cy="12" r="1.6" />
      <path d="M12 10.4V6.3M12 13.6v4.1M13.4 12h4M9.6 12h-4" />
    </svg>
  );
}

/** Shield + check: validation. */
function ValidationGlyph() {
  return (
    <svg {...SHARED_PROPS}>
      <path d="M12 3.5l7 2.6v6.1c0 4-3 6.9-7 8.3-4-1.4-7-4.3-7-8.3V6.1z" />
      <path d="M8.7 12.2l2.3 2.3 4.3-4.7" />
    </svg>
  );
}

/** Generic diamond fallback for any agent number beyond the primary 7. */
function GenericGlyph() {
  return (
    <svg {...SHARED_PROPS}>
      <path d="M12 3.5l8.5 8.5-8.5 8.5-8.5-8.5z" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

const GLYPHS = [
  OrchestratorGlyph,
  SemanticGlyph,
  LexicalGlyph,
  OntologyGlyph,
  RerankingGlyph,
  ReasoningGlyph,
  ValidationGlyph,
  GenericGlyph,
];

/** Code-based SVG glyph for an agent, selected deterministically by number. */
export function AgentIcon({ number, className }: AgentIconProps) {
  const Glyph = GLYPHS[(number - 1) % GLYPHS.length] ?? GenericGlyph;
  return (
    <span className={className} aria-hidden="true">
      <Glyph />
    </span>
  );
}
