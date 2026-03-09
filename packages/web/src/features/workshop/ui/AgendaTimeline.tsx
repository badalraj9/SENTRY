import { CheckCircle2, Circle, Radio } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import type { WorkshopPhase } from "../../../store/slices/workshopSlice";

/* ═══════════════════════════════════════════════════════════════════════════
   Agenda Timeline
   Visual progress indicator for workshop phases
   ═══════════════════════════════════════════════════════════════════════════ */

const STEPS: { id: WorkshopPhase; label: string }[] = [
  { id: "LOBBY", label: "Check-in" },
  { id: "AGENDA", label: "Set Agenda" },
  { id: "BRAINSTORM", label: "Brainstorming" },
  { id: "VOTING", label: "Voting" },
  { id: "SUMMARY", label: "Wrap-up" },
];

interface AgendaTimelineProps {
  currentPhase: WorkshopPhase;
}

export function AgendaTimeline({ currentPhase }: AgendaTimelineProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentPhase);

  return (
    <div className="space-y-4 relative">
      {/* Vertical connecting line */}
      <div className="absolute left-[9px] top-3 bottom-3 w-px border-l border-neutral-200 border-dashed" />

      {STEPS.map((step, index) => {
        const isActive = step.id === currentPhase;
        const isPast = currentIndex > index;

        return (
          <div
            key={step.id}
            className="relative flex items-center gap-3 z-10 group"
          >
            {/* Step Icon */}
            <div
              className={cn(
                "rounded-full p-1 border transition-all duration-300 bg-white",
                isActive &&
                  "border-[#D33E33] text-[#D33E33] scale-110 shadow-[0_0_8px_#D33E33]",
                isPast && "border-black text-black",
                !isActive &&
                  !isPast &&
                  "border-neutral-200 border-dashed text-neutral-300",
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
                "text-[10px] tracking-[0.1em] font-mono transition-colors uppercase",
                isActive && "text-[#D33E33] font-bold",
                isPast && "text-neutral-500 line-through",
                !isActive && !isPast && "text-neutral-400",
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
