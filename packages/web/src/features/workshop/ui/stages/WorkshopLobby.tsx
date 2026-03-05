import { useAppSelector } from '../../../../store/hooks';
import { cn } from '../../../../shared/lib/utils';
import { Avatar, Button } from '../../../../shared/ui';
import { Users, Play } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Workshop Lobby
   Pre-session check-in stage
   ═══════════════════════════════════════════════════════════════════════════ */

export function WorkshopLobby() {
  const { title, objective, participants, facilitatorId } = useAppSelector(
    (state) => state.workshop
  );
  const { user } = useAppSelector((state) => state.auth);
  const isFacilitator = user?.id === facilitatorId;

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-mono text-terminal-500 uppercase tracking-wider">
            Session Starting Soon
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-terminal-100 mb-2">
          {title || 'Workshop'}
        </h1>
        <p className="text-terminal-400 max-w-md">
          {objective || 'Waiting for the facilitator to begin...'}
        </p>
      </div>

      {/* Participants Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Users className="w-4 h-4 text-terminal-500" />
          <span className="text-sm font-mono text-terminal-400">
            {participants.length} participant{participants.length !== 1 ? 's' : ''} joined
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {participants.map((p) => (
            <div
              key={p.userId}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full',
                'bg-terminal-900 border border-terminal-700',
                p.role === 'facilitator' && 'border-warning/30'
              )}
            >
              <Avatar fallback={p.handle} size="sm" status="online" />
              <span className="text-xs font-mono text-terminal-300">{p.handle}</span>
              {p.role === 'facilitator' && (
                <span className="text-[10px] font-mono text-warning">HOST</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Start Button (Facilitator Only) */}
      {isFacilitator && (
        <Button variant="primary" size="lg" className="gap-2">
          <Play className="w-4 h-4" />
          Start Session
        </Button>
      )}

      {!isFacilitator && (
        <p className="text-sm text-terminal-500 font-mono">
          Waiting for facilitator to start...
        </p>
      )}
    </div>
  );
}
