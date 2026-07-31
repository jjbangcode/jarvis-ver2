import type { ElementType, ReactNode } from "react";

interface PanelFrameProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly as?: ElementType;
  readonly ariaLabel?: string;
}

/** Chamfered sci-fi panel used for every HUD card/panel in the dashboard. */
export function PanelFrame({ children, className = "", as: Tag = "div", ariaLabel }: PanelFrameProps) {
  return (
    <div className={`panel-outer ${className}`}>
      <Tag className="panel-inner" aria-label={ariaLabel}>
        {children}
      </Tag>
    </div>
  );
}
