import { cn } from '../../../shared/lib/utils';
import { Avatar } from '../../../shared/ui';
import { Crown, Eye, Mic } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Participant List
   Shows who's in the workshop with their roles
   ═══════════════════════════════════════════════════════════════════════════ */

interface Participant {
  userId: string;
  handle: string;
  role: 'facilitator' | 'presenter' | 'participant' | 'observer';
}

interface ParticipantListProps {
  participants: Participant[];
  currentUserId?: string;
}

export function ParticipantList({ participants, currentUserId }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="px-4 pb-4 text-center text-xs text-terminal-500">
        No participants yet
      </div>
    );
  }

  return (
    <div className="max-h-32 overflow-y-auto px-2 pb-2">
      <div className="space-y-1">
        {participants.map((p) => (
          <div
            key={p.userId}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded text-xs',
              p.userId === currentUserId && 'bg-terminal-800'
            )}
          >
            <Avatar fallback={p.handle} size="sm" status="online" />
            <span className="flex-1 truncate font-mono text-terminal-300">
              {p.handle}
              {p.userId === currentUserId && (
                <span className="text-terminal-500 ml-1">(you)</span>
              )}
            </span>
            <RoleIcon role={p.role} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleIcon({ role }: { role: Participant['role'] }) {
  switch (role) {
    case 'facilitator':
      return <span title="Facilitator"><Crown className="w-3 h-3 text-warning" /></span>;
    case 'presenter':
      return <span title="Presenter"><Mic className="w-3 h-3 text-accent" /></span>;
    case 'observer':
      return <span title="Observer"><Eye className="w-3 h-3 text-terminal-500" /></span>;
    default:
      return null;
  }
}
