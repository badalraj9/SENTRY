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
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center p-6",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center max-w-sm">
        {Icon && (
          <div className="w-16 h-16 rounded-full bg-terminal-900 border border-terminal-800 flex items-center justify-center mb-6">
            <Icon size={32} className="text-terminal-500" />
          </div>
        )}

        <h3 className="text-lg font-medium text-terminal-200 mb-2">{title}</h3>

        {description && (
          <p className="text-sm text-terminal-500 mb-6 text-balance">
            {description}
          </p>
        )}

        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
