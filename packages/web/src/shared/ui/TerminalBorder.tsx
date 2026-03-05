import * as React from "react";
import { cn } from "../lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   TERMINAL BORDER
   Wraps content in a terminal-style panel with optional title bar
   Inspired by Figma design, enhanced with SENTRY color palette
   ═══════════════════════════════════════════════════════════════════════════ */

interface TerminalBorderProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function TerminalBorder({
  children,
  title,
  icon,
  className = "",
  contentClassName = "",
}: TerminalBorderProps) {
  return (
    <div
      className={cn(
        "border border-terminal-700 bg-terminal-950 flex flex-col",
        className,
      )}
    >
      {title && (
        <div className="border-b border-terminal-700 px-3 py-2 bg-terminal-850 flex items-center gap-2 shrink-0">
          {icon || <span className="text-success font-mono text-sm">$</span>}
          <span className="text-terminal-300 text-xs font-mono uppercase tracking-wider">
            {title}
          </span>
        </div>
      )}
      <div className={cn("flex-1 overflow-auto", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

export default TerminalBorder;
