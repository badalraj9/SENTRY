'use client';

import { CheckCircle2, Circle, Radio } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import type { WorkshopPhase } from '../../../store/slices/workshopSlice';

/* ═══════════════════════════════════════════════════════════════════════════
   Agenda Timeline
   Visual progress indicator for workshop phases
   ═══════════════════════════════════════════════════════════════════════════ */

const STEPS: { id: WorkshopPhase; label: string }[] = [
  { id: 'LOBBY', label: 'Check-in' },
  { id: 'AGENDA', label: 'Set Agenda' },
  { id: 'BRAINSTORM', label: 'Brainstorming' },
  { id: 'VOTING', label: 'Voting' },
  { id: 'SUMMARY', label: 'Wrap-up' },
];

interface AgendaTimelineProps {
  currentPhase: WorkshopPhase;
}

export function AgendaTimeline({ currentPhase }: AgendaTimelineProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentPhase);

  return (
    <div className="space-y-4 relative">
      {/* Vertical connecting line */}
      <div className="absolute left-[9px] top-3 bottom-3 w-px bg-terminal-700" />

      {STEPS.map((step, index) => {
        const isActive = step.id === currentPhase;
        const isPast = currentIndex > index;

        return (
          <div key={step.id} className="relative flex items-center gap-3 z-10 group">
            {/* Step Icon */}
            <div
              className={cn(
                'rounded-full p-1 border-2 transition-all duration-300 bg-terminal-950',
                isActive && 'border-success text-success scale-110',
                isPast && 'border-success/50 text-success/50',
                !isActive && !isPast && 'border-terminal-700 text-terminal-700'
              )}
            >
              {isActive ? (
                <Radio size={12} className="animate-pulse" />
              ) : isPast ? (
                <CheckCircle2 size={12} />
              ) : (
                <Circle size={12} />
              )}
            </div>

            {/* Step Label */}
            <span
              className={cn(
                'text-xs font-mono transition-colors',
                isActive && 'text-success font-medium',
                isPast && 'text-terminal-500 line-through',
                !isActive && !isPast && 'text-terminal-600'
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
