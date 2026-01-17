'use client';

import { Clock } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   Workshop Timer
   Countdown display for timed workshop activities
   ═══════════════════════════════════════════════════════════════════════════ */

interface WorkshopTimerProps {
  seconds: number;
}

export function WorkshopTimer({ seconds }: WorkshopTimerProps) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds <= 60;
  const isCritical = seconds <= 10;

  const formatted = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2">
      <Clock
        className={cn(
          'w-4 h-4 transition-colors',
          isCritical ? 'text-error animate-pulse' : isLow ? 'text-warning' : 'text-terminal-400'
        )}
      />
      <span
        className={cn(
          'font-mono text-lg font-semibold tabular-nums',
          isCritical ? 'text-error' : isLow ? 'text-warning' : 'text-terminal-200'
        )}
      >
        {formatted}
      </span>
    </div>
  );
}
