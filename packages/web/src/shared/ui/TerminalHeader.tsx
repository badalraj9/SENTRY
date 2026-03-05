

import * as React from 'react';
import { Terminal, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   TERMINAL HEADER
   Page-level header bar matching the Login page style
   Used at the top of all main views for consistent terminal chrome
   ═══════════════════════════════════════════════════════════════════════════ */

interface TerminalHeaderProps {
  title: string;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  className?: string;
}

export function TerminalHeader({
  title,
  subtitle,
  statusBadge,
  className
}: TerminalHeaderProps) {
  return (
    <div className={cn(
      'p-4 border-b border-terminal-700 flex items-center justify-between bg-terminal-900',
      className
    )}>
      <div className="flex items-center gap-2 text-terminal-400">
        <Terminal className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wider font-mono font-medium">
          {title}
        </span>
        {subtitle && (
          <>
            <span className="text-terminal-600">•</span>
            <span className="text-xs text-terminal-500">{subtitle}</span>
          </>
        )}
      </div>
      
      {statusBadge || (
        <div className="flex items-center gap-2 text-terminal-500 text-xs">
          <Shield className="w-3 h-3" />
          <span className="font-mono">SECURE LINK</span>
        </div>
      )}
    </div>
  );
}

export default TerminalHeader;
