'use client';

import * as React from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { syncState, type WorkshopState } from '../../../store/slices/workshopSlice';
import { socket } from '../../../lib/socket';
import { cn } from '../../../shared/lib/utils';
import { Skeleton } from '../../../shared/ui';

// Stage Components
import { WorkshopLobby } from './stages/WorkshopLobby';
import { BrainstormCanvas } from './stages/BrainstormCanvas';
import { VotingBooth } from './stages/VotingBooth';
import { WorkshopSummary } from './stages/WorkshopSummary';
import { AgendaTimeline } from './AgendaTimeline';
import { ParticipantList } from './ParticipantList';
import { WorkshopTimer } from './WorkshopTimer';

import { Users, Clock, Zap } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Workshop Live Session
   Synchronized multiplayer-style workshop experience
   ═══════════════════════════════════════════════════════════════════════════ */

export function WorkshopLiveSession() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const dispatch = useAppDispatch();
  const { activePhase, title, objective, participants, timer, loading } = useAppSelector(
    (state) => state.workshop
  );
  const { user } = useAppSelector((state) => state.auth);

  // ═══════════════════════════════════════════════════════════════════════
  // NEURAL LINK: Connect to workshop room via WebSocket
  // ═══════════════════════════════════════════════════════════════════════
  React.useEffect(() => {
    if (!workshopId || !socket) return;

    // Join workshop room
    socket.emit('workshop.join', { workshopId });

    // Listen for state changes from facilitator
    const handleWorkshopUpdate = (newState: Partial<WorkshopState>) => {
      dispatch(syncState(newState));
    };

    // Listen for participant changes
    const handleParticipantJoin = (participant: { userId: string; handle: string; role: string }) => {
      dispatch({ type: 'workshop/addParticipant', payload: { ...participant, joinedAt: new Date().toISOString() } });
    };

    const handleParticipantLeave = (userId: string) => {
      dispatch({ type: 'workshop/removeParticipant', payload: userId });
    };

    socket?.on('workshop.updated', handleWorkshopUpdate);
    socket?.on('workshop.participant_joined', handleParticipantJoin);
    socket?.on('workshop.participant_left', handleParticipantLeave);

    return () => {
      socket?.emit('workshop.leave', { workshopId });
      socket?.off('workshop.updated', handleWorkshopUpdate);
      socket?.off('workshop.participant_joined', handleParticipantJoin);
      socket?.off('workshop.participant_left', handleParticipantLeave);
    };
  }, [workshopId, dispatch]);

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE RENDERER: Switch components based on phase
  // ═══════════════════════════════════════════════════════════════════════
  const renderStage = () => {
    switch (activePhase) {
      case 'LOBBY':
        return <WorkshopLobby key="lobby" />;
      case 'BRAINSTORM':
        return <BrainstormCanvas key="brainstorm" />;
      case 'VOTING':
        return <VotingBooth key="voting" />;
      case 'SUMMARY':
        return <WorkshopSummary key="summary" />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-terminal-500 font-mono">Waiting for facilitator...</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Skeleton className="w-32 h-8" />
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden bg-terminal-950">
      {/* LEFT SIDEBAR: Agenda + Participants */}
      <aside className="w-64 flex-none border-r border-terminal-700 flex flex-col bg-terminal-900">
        {/* Workshop Header */}
        <div className="p-4 border-b border-terminal-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-success" />
            <span className="text-xs font-mono text-terminal-500 uppercase tracking-wider">
              Live Session
            </span>
          </div>
          <h2 className="text-sm font-medium text-terminal-200 truncate">
            {title || 'Workshop'}
          </h2>
        </div>

        {/* Timer */}
        {timer !== null && (
          <div className="px-4 py-3 border-b border-terminal-700">
            <WorkshopTimer seconds={timer} />
          </div>
        )}

        {/* Agenda Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-[10px] font-mono text-terminal-500 uppercase tracking-wider mb-4">
            Session Agenda
          </h3>
          <AgendaTimeline currentPhase={activePhase} />
        </div>

        {/* Participants */}
        <div className="border-t border-terminal-700">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-terminal-500">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs font-mono">{participants.length} Online</span>
            </div>
          </div>
          <ParticipantList participants={participants} currentUserId={user?.id} />
        </div>
      </aside>

      {/* MAIN: Active Stage with Animated Transitions */}
      <main className="flex-1 relative overflow-hidden">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(63 63 70) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Stage Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 1.02 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative h-full w-full p-6 overflow-y-auto"
          >
            {renderStage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default WorkshopLiveSession;
