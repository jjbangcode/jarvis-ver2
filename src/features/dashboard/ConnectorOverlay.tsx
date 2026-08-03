import { useEffect, useRef, useState } from "react";
import type { AgentRun } from "@/types/dashboard";
import { AGENT_STATUS_META } from "@/features/agents/agentStatus";
import styles from "./ConnectorOverlay.module.css";

interface ConnectorLine {
  readonly id: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly color: string;
  /** Running/loading agents get the animated flow dashes; other statuses render a static line. */
  readonly active: boolean;
}

interface ConnectorOverlayProps {
  readonly agents: readonly AgentRun[];
}

/**
 * SVG overlay spanning the whole body grid, drawn behind the agent cards and
 * core (see `z-index: -1` in the module CSS). Reads DOM positions of each
 * card's `[data-agent-port]` anchor and the core's `[data-core-anchor]`
 * element on every layout-relevant change, rather than threading refs
 * through AgentCard/JarvisCore.
 */
export function ConnectorOverlay({ agents }: ConnectorOverlayProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [lines, setLines] = useState<readonly ConnectorLine[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    const container = svg?.parentElement;
    if (!svg || !container) return undefined;

    const recompute = () => {
      const containerRect = container.getBoundingClientRect();
      const coreEl = container.querySelector<HTMLElement>("[data-core-anchor]");
      if (!containerRect.width || !containerRect.height || !coreEl) {
        setLines([]);
        return;
      }

      const coreRect = coreEl.getBoundingClientRect();
      const coreCenter = {
        x: coreRect.left + coreRect.width / 2 - containerRect.left,
        y: coreRect.top + coreRect.height / 2 - containerRect.top,
      };
      const coreRadius = (Math.min(coreRect.width, coreRect.height) / 2) * 0.95;

      const next: ConnectorLine[] = [];
      for (const agent of agents) {
        const portEl = container.querySelector<HTMLElement>(`[data-agent-port="${agent.id}"]`);
        if (!portEl) continue;
        const portRect = portEl.getBoundingClientRect();
        const port = {
          x: portRect.left + portRect.width / 2 - containerRect.left,
          y: portRect.top + portRect.height / 2 - containerRect.top,
        };
        const dx = port.x - coreCenter.x;
        const dy = port.y - coreCenter.y;
        const dist = Math.hypot(dx, dy) || 1;
        const edge = {
          x: coreCenter.x + (dx / dist) * coreRadius,
          y: coreCenter.y + (dy / dist) * coreRadius,
        };
        const meta = AGENT_STATUS_META[agent.status];
        next.push({
          id: agent.id,
          x1: edge.x,
          y1: edge.y,
          x2: port.x,
          y2: port.y,
          color: meta.color,
          active: agent.status === "running" || agent.status === "loading",
        });
      }
      setLines(next);
    };

    recompute();

    const resizeObserver = new ResizeObserver(recompute);
    resizeObserver.observe(container);
    const coreEl = container.querySelector<HTMLElement>("[data-core-anchor]");
    if (coreEl) resizeObserver.observe(coreEl);
    for (const agent of agents) {
      const portEl = container.querySelector<HTMLElement>(`[data-agent-port="${agent.id}"]`);
      if (portEl) resizeObserver.observe(portEl);
    }

    window.addEventListener("resize", recompute);
    document.fonts?.ready.then(recompute).catch(() => undefined);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [agents]);

  return (
    <svg ref={svgRef} className={styles.overlay} aria-hidden="true">
      {lines.map((line) => (
        <g key={line.id}>
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className={styles.baseLine}
            style={{ ["--connector-color" as string]: line.color }}
          />
          {line.active && (
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={styles.flowLine}
              style={{ ["--connector-color" as string]: line.color }}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
