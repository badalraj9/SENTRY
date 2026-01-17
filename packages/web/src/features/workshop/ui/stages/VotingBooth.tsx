'use client';

import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { voteIdea } from '../../../../store/slices/workshopSlice';
import { cn } from '../../../../shared/lib/utils';
import { ThumbsUp, Trophy } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Voting Booth
   Vote on brainstormed ideas to prioritize
   ═══════════════════════════════════════════════════════════════════════════ */

export function VotingBooth() {
  const dispatch = useAppDispatch();
  const { ideas } = useAppSelector((state) => state.workshop);
  const { user } = useAppSelector((state) => state.auth);

  // Sort by votes descending
  const sortedIdeas = [...ideas].sort((a, b) => b.votes.length - a.votes.length);

  const handleVote = (ideaId: string) => {
    if (!user) return;
    dispatch(voteIdea({ ideaId, userId: user.id }));
    // In real app: socket.emit('workshop.idea_vote', { ideaId });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-terminal-100 mb-1">
          Voting
        </h1>
        <p className="text-sm text-terminal-400">
          Click to vote on the ideas you think are most important
        </p>
      </div>

      {/* Ideas List */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-8">
        {sortedIdeas.map((idea, index) => {
          const hasVoted = user ? idea.votes.includes(user.id) : false;
          const isTop3 = index < 3;

          return (
            <motion.div
              key={idea.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg',
                'bg-terminal-900 border border-terminal-700',
                'hover:border-terminal-600 transition-colors',
                isTop3 && 'border-success/20'
              )}
            >
              {/* Rank */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  isTop3 ? 'bg-success/20 text-success' : 'bg-terminal-800 text-terminal-500'
                )}
              >
                {index === 0 ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-mono font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Idea Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-terminal-200 line-clamp-2">
                  {idea.text || <span className="text-terminal-500 italic">Empty idea</span>}
                </p>
              </div>

              {/* Vote Count */}
              <span className="text-xs font-mono text-terminal-500 flex-shrink-0">
                {idea.votes.length} vote{idea.votes.length !== 1 ? 's' : ''}
              </span>

              {/* Vote Button */}
              <button
                onClick={() => handleVote(idea.id)}
                className={cn(
                  'p-2 rounded-md transition-all flex-shrink-0',
                  hasVoted
                    ? 'bg-success/20 text-success'
                    : 'bg-terminal-800 text-terminal-400 hover:bg-terminal-700 hover:text-terminal-200'
                )}
              >
                <ThumbsUp className={cn('w-4 h-4', hasVoted && 'fill-current')} />
              </button>
            </motion.div>
          );
        })}

        {ideas.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-terminal-400">No ideas to vote on</p>
          </div>
        )}
      </div>
    </div>
  );
}
