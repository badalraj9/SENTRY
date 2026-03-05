import { useAppSelector } from '../../../../store/hooks';
import { cn } from '../../../../shared/lib/utils';
import { Button, Badge } from '../../../../shared/ui';
import { Download, CheckCircle2, MessageSquare, Trophy, Clock } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Workshop Summary
   End-of-session wrap-up with key outcomes
   ═══════════════════════════════════════════════════════════════════════════ */

export function WorkshopSummary() {
  const { title, ideas, participants } = useAppSelector((state) => state.workshop);

  // Get top voted ideas
  const topIdeas = [...ideas]
    .sort((a, b) => b.votes.length - a.votes.length)
    .slice(0, 5);

  // Stats
  const totalVotes = ideas.reduce((sum, i) => sum + i.votes.length, 0);
  const uniqueContributors = new Set(ideas.map((i) => i.userId)).size;

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <CheckCircle2 className="w-6 h-6 text-success" />
        </div>
        <h1 className="text-2xl font-semibold text-terminal-100 mb-2">
          Session Complete
        </h1>
        <p className="text-terminal-400">{title || 'Workshop Summary'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatBox
          icon={<MessageSquare className="w-4 h-4" />}
          label="Ideas Shared"
          value={ideas.length}
        />
        <StatBox
          icon={<Trophy className="w-4 h-4" />}
          label="Total Votes"
          value={totalVotes}
        />
        <StatBox
          icon={<Clock className="w-4 h-4" />}
          label="Participants"
          value={participants.length}
        />
      </div>

      {/* Top Ideas */}
      <div className="flex-1 mb-6">
        <h2 className="text-xs font-mono text-terminal-500 uppercase tracking-wider mb-4">
          Top Voted Ideas
        </h2>
        <div className="space-y-2">
          {topIdeas.map((idea, index) => (
            <div
              key={idea.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                'bg-terminal-900 border border-terminal-700'
              )}
            >
              <Badge variant={index === 0 ? 'success' : 'default'}>
                #{index + 1}
              </Badge>
              <p className="flex-1 text-sm text-terminal-200 line-clamp-1">
                {idea.text}
              </p>
              <span className="text-xs font-mono text-terminal-500">
                {idea.votes.length} votes
              </span>
            </div>
          ))}
          {topIdeas.length === 0 && (
            <p className="text-sm text-terminal-500 text-center py-4">
              No ideas were voted on
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Button variant="secondary" className="gap-2">
          <Download className="w-4 h-4" />
          Export Summary
        </Button>
        <Button variant="primary">
          Close Session
        </Button>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-terminal-900 border border-terminal-700 rounded-lg p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-terminal-500 mb-2">
        {icon}
        <span className="text-xs font-mono uppercase">{label}</span>
      </div>
      <span className="text-2xl font-mono font-semibold text-terminal-100">
        {value}
      </span>
    </div>
  );
}
