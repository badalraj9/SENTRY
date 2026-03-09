import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface TabItem<T extends string = string> {
  label: string;
  value: T;
  icon?: React.ComponentType<{ className?: string }>;
}

interface LiquidTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (value: T) => void;
  className?: string;
  /** Unique ID for the layoutId (use different ids if multiple tab groups on same page) */
  layoutId?: string;
  size?: "sm" | "md";
}

/**
 * LiquidTabs — frosted glass capsule tab switcher.
 * Same liquid glass morphing pill as the TopNav, using Framer Motion layoutId.
 * Use this anywhere you have a group of filter/tab options.
 */
export function LiquidTabs<T extends string = string>({
  tabs,
  active,
  onChange,
  className,
  layoutId = "liquid-tabs-pill",
  size = "md",
}: LiquidTabsProps<T>) {
  const prevActiveRef = React.useRef(active);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  React.useEffect(() => {
    const prevIdx = tabs.findIndex((t) => t.value === prevActiveRef.current);
    const nextIdx = tabs.findIndex((t) => t.value === active);
    if (prevIdx !== nextIdx) {
      setDirection(nextIdx > prevIdx ? 1 : -1);
      prevActiveRef.current = active;
    }
  }, [active, tabs]);

  const textSize = size === "sm" ? "text-[10px]" : "text-[11px]";
  const padX = size === "sm" ? "px-3" : "px-4";
  const padY = size === "sm" ? "py-1.5" : "py-2";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 p-1 rounded-full",
        className,
      )}
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.9)",
        boxShadow: [
          "0 2px 16px rgba(0,0,0,0.06)",
          "inset 0 1px 1px rgba(255,255,255,1)",
        ].join(", "),
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full outline-none select-none transition-colors duration-150 font-mono tracking-[0.12em] uppercase z-0",
              textSize,
              padX,
              padY,
              isActive
                ? "text-black font-semibold"
                : "text-neutral-500 hover:text-black",
            )}
          >
            {/* Liquid glass active pill */}
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full z-[-1]"
                transition={{
                  type: "spring",
                  stiffness: 340,
                  damping: 28,
                  mass: 0.85,
                }}
                animate={{
                  scaleX: [0.78, 1.06, 0.97, 1],
                  scaleY: [1.14, 0.95, 1.02, 1],
                }}
                style={{
                  transformOrigin:
                    direction > 0 ? "left center" : "right center",
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(255,255,255,1)",
                  boxShadow: [
                    "0 2px 10px rgba(0,0,0,0.09)",
                    "0 1px 3px rgba(0,0,0,0.05)",
                    "inset 0 1.5px 2px rgba(255,255,255,1)",
                    "inset 0 -1px 1.5px rgba(0,0,0,0.04)",
                  ].join(", "),
                }}
              />
            )}
            {tab.icon && <tab.icon className="w-3.5 h-3.5 relative z-10" />}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default LiquidTabs;
