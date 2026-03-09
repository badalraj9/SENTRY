import * as React from "react";
import { cn } from "../../shared/lib/utils";
import { Button } from "./button";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center p-6 bg-transparent",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center max-w-md border border-neutral-200 border-dashed rounded-3xl bg-white p-12">
        <div className="text-[120px] font-mono text-neutral-200 mb-8 leading-none select-none">
          #
        </div>

        <h3 className="text-[32px] font-header font-bold tracking-tighter leading-none text-black uppercase mb-4">
          {title}
        </h3>

        {description && (
          <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono mb-8 leading-relaxed max-w-sm mt-2">
            {description}
          </p>
        )}

        {actionLabel && onAction && (
          <button
            className="btn-brutal py-4 px-8 text-[11px] tracking-[0.15em] rounded-full hover:scale-[0.98] active:scale-95 transition-all ease-mechanical duration-150"
            onClick={onAction}
          >
            [{actionLabel}]
          </button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
