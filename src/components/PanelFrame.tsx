import type { ElementType, ReactNode } from "react";

interface PanelFrameProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly as?: ElementType;
  readonly ariaLabel?: string;
  /** Set to 0 to make the panel a keyboard focus stop (e.g. status cards with no other focusable content). */
  readonly tabIndex?: number;
}

/** Chamfered sci-fi panel used for every HUD card/panel in the dashboard. */
export function PanelFrame({ children, className = "", as: Tag = "div", ariaLabel, tabIndex }: PanelFrameProps) {
  return (
    <div className={`panel-outer ${className}`}>
      <Tag className="panel-inner" aria-label={ariaLabel} tabIndex={tabIndex}>
        {children}
      </Tag>
    </div>
  );
}
