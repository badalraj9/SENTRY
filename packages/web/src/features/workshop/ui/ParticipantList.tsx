import { cn } from "../../../shared/lib/utils";
import { Avatar } from "../../../shared/ui";
import { Crown, Eye, Mic } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Participant List
   Shows who's in the workshop with their roles
   ═══════════════════════════════════════════════════════════════════════════ */

interface Participant {
  userId: string;
  handle: string;
  role: "facilitator" | "presenter" | "participant" | "observer";
}

interface ParticipantListProps {
  participants: Participant[];
  currentUserId?: string;
}

export function ParticipantList({
  participants,
  currentUserId,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="px-6 pb-6 text-center text-[10px] tracking-[0.1em] text-neutral-400 uppercase font-mono">
        No participants yet
      </div>
    );
  }

  return (
    <div className="max-h-48 overflow-y-auto px-4 pb-4">
      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.userId}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-mono border border-transparent transition-colors",
              p.userId === currentUserId
                ? "bg-neutral-50 border-neutral-200 border-dashed"
                : "hover:bg-neutral-50",
            )}
          >
            <Avatar fallback={p.handle} size="sm" status="online" />
            <span className="flex-1 truncate tracking-[0.05em] uppercase text-black font-bold">
              {p.handle}
              {p.userId === currentUserId && (
                <span className="text-neutral-400 ml-2 font-normal">(YOU)</span>
              )}
            </span>
            <RoleIcon role={p.role} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleIcon({ role }: { role: Participant["role"] }) {
  switch (role) {
    case "facilitator":
      return (
        <span title="Facilitator">
          <Crown className="w-4 h-4 text-amber-500" />
        </span>
      );
    case "presenter":
      return (
        <span title="Presenter">
          <Mic className="w-4 h-4 text-blue-500" />
        </span>
      );
    case "observer":
      return (
        <span title="Observer">
          <Eye className="w-4 h-4 text-neutral-400" />
        </span>
      );
    default:
      return null;
  }
}
