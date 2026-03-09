import { useAppSelector } from "../../../../store/hooks";
import { cn } from "../../../../shared/lib/utils";
import { Avatar } from "../../../../shared/ui";
import { Users, Play } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Workshop Lobby
   Pre-session check-in stage
   ═══════════════════════════════════════════════════════════════════════════ */

export function WorkshopLobby() {
  const { title, objective, participants, facilitatorId } = useAppSelector(
    (state) => state.workshop,
  );
  const { user } = useAppSelector((state) => state.auth);
  const isFacilitator = user?.id === facilitatorId;

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center p-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]" />
          <span className="text-[10px] font-mono text-amber-600 uppercase tracking-[0.15em]">
            Session Starting Soon
          </span>
        </div>
        <h1 className="text-[32px] font-header font-bold tracking-tighter uppercase text-black mb-4">
          {title || "Workshop"}
        </h1>
        <p className="text-[12px] font-mono text-neutral-500 max-w-md mx-auto leading-relaxed">
          {objective || "Waiting for the facilitator to begin..."}
        </p>
      </div>

      {/* Participants Grid */}
      <div className="mb-12 w-full">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Users className="w-4 h-4 text-neutral-400" />
          <span className="text-[10px] font-mono text-neutral-500 tracking-[0.1em] uppercase">
            {participants.length} participant
            {participants.length !== 1 ? "s" : ""} joined
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {participants.map((p) => (
            <div
              key={p.userId}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-full",
                "bg-white border border-neutral-200 border-dashed shadow-sm",
                p.role === "facilitator" &&
                  "border-amber-500/50 bg-amber-50/50",
              )}
            >
              <Avatar fallback={p.handle} size="sm" status="online" />
              <span className="text-[11px] font-mono font-bold tracking-[0.05em] text-black uppercase">
                {p.handle}
              </span>
              {p.role === "facilitator" && (
                <span className="text-[9px] font-mono text-amber-600 tracking-[0.1em] px-2 py-0.5 bg-amber-100 rounded-full">
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Start Button (Facilitator Only) */}
      {isFacilitator && (
        <button className="btn-brutal flex items-center justify-center gap-3 py-4 px-8 text-[12px] tracking-[0.15em] rounded-full w-full max-w-sm">
          <Play className="w-5 h-5 fill-current" />
          START SESSION
        </button>
      )}

      {!isFacilitator && (
        <div className="p-6 rounded-3xl border border-neutral-200 border-dashed bg-white/50 backdrop-blur-sm">
          <p className="text-[11px] text-neutral-500 font-mono tracking-[0.1em] uppercase flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-neutral-300 animate-pulse" />
            Waiting for facilitator to start...
          </p>
        </div>
      )}
    </div>
  );
}
