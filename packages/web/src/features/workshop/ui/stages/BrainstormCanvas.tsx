'use client';

import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { addIdea, updateIdea } from '../../../../store/slices/workshopSlice';
import { cn } from '../../../../shared/lib/utils';
import { Button } from '../../../../shared/ui';
import { Plus, Trash2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Brainstorm Canvas
   Interactive sticky-note style idea collection
   ═══════════════════════════════════════════════════════════════════════════ */

export function BrainstormCanvas() {
  const dispatch = useAppDispatch();
  const { ideas, objective } = useAppSelector((state) => state.workshop);
  const { user } = useAppSelector((state) => state.auth);

  const handleAddIdea = () => {
    if (!user) return;
    
    const newIdea = {
      id: crypto.randomUUID(),
      text: '',
      userId: user.id,
      votes: [],
      createdAt: new Date().toISOString(),
    };
    dispatch(addIdea(newIdea));
    
    // In real app: socket.emit('workshop.idea_add', newIdea);
  };

  const handleUpdateIdea = (id: string, text: string) => {
    dispatch(updateIdea({ id, text }));
    // In real app: debounced socket.emit('workshop.idea_update', { id, text });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-semibold text-terminal-100 mb-1">
            Brainstorming
          </h1>
          <p className="text-sm text-terminal-400 max-w-lg">
            {objective || 'Share your ideas and thoughts'}
          </p>
        </div>
        <Button variant="primary" onClick={handleAddIdea} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Card
        </Button>
      </div>

      {/* Ideas Grid */}
      <div className="flex-1 overflow-y-auto">
        {ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-lg bg-terminal-800 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-terminal-600" />
            </div>
            <p className="text-terminal-400 mb-2">No ideas yet</p>
            <p className="text-sm text-terminal-500">
              Click "Add Card" to share your thoughts
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isOwner={idea.userId === user?.id}
                onUpdate={handleUpdateIdea}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Idea Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface IdeaCardProps {
  idea: {
    id: string;
    text: string;
    userId: string;
    votes: string[];
  };
  isOwner: boolean;
  onUpdate: (id: string, text: string) => void;
}

function IdeaCard({ idea, isOwner, onUpdate }: IdeaCardProps) {
  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={cn(
        'group relative h-40 p-4 rounded-lg',
        'bg-terminal-900 border border-terminal-700',
        'hover:border-terminal-600 transition-colors',
        'flex flex-col'
      )}
    >
      <textarea
        value={idea.text}
        onChange={(e) => onUpdate(idea.id, e.target.value)}
        placeholder="Type your thought..."
        disabled={!isOwner}
        className={cn(
          'flex-1 bg-transparent resize-none w-full',
          'text-sm text-terminal-200 placeholder:text-terminal-600',
          'focus:outline-none leading-relaxed',
          !isOwner && 'cursor-default'
        )}
        autoFocus={!idea.text}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-terminal-700">
        <span className="text-[10px] font-mono text-terminal-500">
          {idea.votes.length} vote{idea.votes.length !== 1 ? 's' : ''}
        </span>
        {isOwner && (
          <button className="opacity-0 group-hover:opacity-100 p-1 text-terminal-500 hover:text-error transition-all">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
