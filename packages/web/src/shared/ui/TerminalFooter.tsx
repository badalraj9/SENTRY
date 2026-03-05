

import { cn } from '../lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   TERMINAL FOOTER
   Page-level footer bar matching the Login page style
   ═══════════════════════════════════════════════════════════════════════════ */

interface TerminalFooterProps {
  text?: string;
  className?: string;
}

export function TerminalFooter({
  text = 'SENTRY COLLABORATIVE OS • AUTHORIZED PERSONNEL ONLY',
  className
}: TerminalFooterProps) {
  return (
    <div className={cn(
      'p-4 border-t border-terminal-700 text-center text-terminal-500 text-[10px] font-mono bg-terminal-900',
      className
    )}>
      {text}
    </div>
  );
}

export default TerminalFooter;
