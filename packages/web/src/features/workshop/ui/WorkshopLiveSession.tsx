import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import {
  syncState,
  type WorkshopState,
} from "../../../store/slices/workshopSlice";
import { socket } from "../../../lib/socket";
import { cn } from "../../../shared/lib/utils";
import { Skeleton, GlassButton, LiquidTabs } from "../../../shared/ui";
import {
  useGetWorkshopsQuery,
  useGetProjectsQuery,
  useCreateWorkshopMutation,
} from "../../../shared/api/apiSlice";

// Stage Components
import { WorkshopLobby } from "./stages/WorkshopLobby";
import { BrainstormCanvas } from "./stages/BrainstormCanvas";
import { VotingBooth } from "./stages/VotingBooth";
import { WorkshopSummary } from "./stages/WorkshopSummary";
import { AgendaTimeline } from "./AgendaTimeline";
import { ParticipantList } from "./ParticipantList";
import { WorkshopTimer } from "./WorkshopTimer";

import {
  Users,
  Clock,
  Zap,
  Plus,
  Calendar,
  MonitorPlay,
  ArrowRight,
  Play,
  Circle,
  X,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

/* ═══════════════════════════════════════════════════════════════════════════
   Workshop Live Session
   Synchronized multiplayer-style workshop experience
   ═══════════════════════════════════════════════════════════════════════════ */

export function WorkshopLiveSession() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { activePhase, title, objective, participants, timer, loading } =
    useAppSelector((state) => state.workshop);
  const { user } = useAppSelector((state) => state.auth);

  // If no workshopId, show the workshops hub/list
  if (!workshopId) {
    return <WorkshopsHub />;
  }

  // ... rest of the existing WorkshopLiveSession code
  React.useEffect(() => {
    if (!workshopId || !socket) return;

    // Join workshop room
    socket.emit("workshop.join", { workshopId });

    // Listen for state changes from facilitator
    const handleWorkshopUpdate = (newState: Partial<WorkshopState>) => {
      dispatch(syncState(newState));
    };

    // Listen for participant changes
    const handleParticipantJoin = (participant: {
      userId: string;
      handle: string;
      role: string;
    }) => {
      dispatch({
        type: "workshop/addParticipant",
        payload: { ...participant, joinedAt: new Date().toISOString() },
      });
    };

    const handleParticipantLeave = (userId: string) => {
      dispatch({ type: "workshop/removeParticipant", payload: userId });
    };

    socket?.on("workshop.updated", handleWorkshopUpdate);
    socket?.on("workshop.participant_joined", handleParticipantJoin);
    socket?.on("workshop.participant_left", handleParticipantLeave);

    return () => {
      socket?.emit("workshop.leave", { workshopId });
      socket?.off("workshop.updated", handleWorkshopUpdate);
      socket?.off("workshop.participant_joined", handleParticipantJoin);
      socket?.off("workshop.participant_left", handleParticipantLeave);
    };
  }, [workshopId, dispatch]);

  // Stage Renderer: Switch components based on phase
  const renderStage = () => {
    switch (activePhase) {
      case "LOBBY":
        return <WorkshopLobby key="lobby" />;
      case "BRAINSTORM":
        return <BrainstormCanvas key="brainstorm" />;
      case "VOTING":
        return <VotingBooth key="voting" />;
      case "SUMMARY":
        return <WorkshopSummary key="summary" />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-[10px] tracking-[0.1em] text-neutral-500 font-mono uppercase">
              Waiting for facilitator...
            </p>
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
    <div className="h-full flex overflow-hidden bg-[#f3f4f6] bg-grid-pattern">
      {/* LEFT SIDEBAR: Agenda + Participants */}
      <aside className="w-80 flex-none border-r border-neutral-200 flex flex-col bg-white">
        {/* Workshop Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 fill-[#D33E33] text-[#D33E33] animate-pulse" />
            <span className="text-[10px] font-mono text-[#D33E33] uppercase tracking-[0.15em]">
              Live Session
            </span>
          </div>
          <h2 className="text-[16px] font-mono font-bold tracking-[0.05em] uppercase text-black truncate">
            {title || "Workshop"}
          </h2>
        </div>

        {/* Timer */}
        {timer !== null && (
          <div className="px-6 py-4 border-b border-neutral-200">
            <WorkshopTimer seconds={timer} />
          </div>
        )}

        {/* Agenda Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.1em] mb-6">
            Session Agenda
          </h3>
          <AgendaTimeline currentPhase={activePhase} />
        </div>

        {/* Participants */}
        <div className="border-t border-neutral-200">
          <div className="p-6 flex items-center justify-between pb-3">
            <div className="flex items-center gap-2 text-neutral-500">
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-mono tracking-[0.1em] uppercase">
                {participants.length} Online
              </span>
            </div>
          </div>
          <ParticipantList
            participants={participants}
            currentUserId={user?.id}
          />
        </div>
      </aside>

      {/* MAIN: Active Stage with Animated Transitions */}
      <main className="flex-1 relative overflow-hidden bg-transparent">
        {/* Stage Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative h-full w-full p-8 overflow-y-auto"
          >
            {renderStage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Workshops Hub (List View)
   Shows all workshops with timeline view for past and active stage for live
   ═══════════════════════════════════════════════════════════════════════════ */

function WorkshopsHub() {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState<
    "all" | "active" | "scheduled" | "completed"
  >("all");
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const { data: projects = [] } = useGetProjectsQuery();
  const activeProjectId = projects[0]?.id || "";
  const { data: workshops = [], isLoading: workshopsLoading } =
    useGetWorkshopsQuery(
      { projectId: activeProjectId },
      { skip: !activeProjectId },
    );
  const [createWorkshop, { isLoading: isCreating }] =
    useCreateWorkshopMutation();

  const filteredWorkshops = React.useMemo(() => {
    if (filter === "all") return workshops;
    return workshops.filter((w) => w.status === filter);
  }, [workshops, filter]);

  const handleCreateWorkshop = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProjectId) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const objective = formData.get("objective") as string;
    const maxParticipants =
      parseInt(formData.get("maxParticipants") as string) || 10;

    if (!title || !objective) return;

    try {
      const result = await createWorkshop({
        projectId: activeProjectId,
        title,
        objective,
        maxParticipants,
      }).unwrap();
      setShowCreateModal(false);
      navigate(`/workshops/${result.id}`);
    } catch (error) {
      console.error("Failed to create workshop:", error);
    }
  };

  const liveWorkshop = workshops.find((w) => w.status === "active");
  const scheduledWorkshops = workshops
    .filter((w) => w.status === "scheduled")
    .slice(0, 4);
  const pastWorkshops = workshops
    .filter((w) => w.status === "completed")
    .slice(0, 6);

  return (
    <div className="h-full w-full bg-[#f3f4f6] bg-grid-pattern overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full border border-neutral-200 bg-white">
              <MonitorPlay className="w-6 h-6 text-black" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[32px] font-header font-bold tracking-tighter leading-none text-black uppercase">
                Workshops
              </h1>
              <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono mt-2">
                Collaborate in real-time sessions
              </p>
            </div>
          </div>
          <GlassButton onClick={() => setShowCreateModal(true)} size="sm">
            <Plus className="w-4 h-4" />
            NEW WORKSHOP
          </GlassButton>
        </motion.div>

        {/* Create Workshop Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md p-8 mx-4 rounded-3xl bg-white border border-neutral-200 border-b-[4px]"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-header text-[28px] tracking-tighter uppercase font-bold text-black">
                    New Workshop
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors group"
                  >
                    <X className="w-5 h-5 text-neutral-400 group-hover:text-black" />
                  </button>
                </div>
                <form onSubmit={handleCreateWorkshop} className="space-y-6">
                  <div>
                    <label className="block text-[10px] tracking-[0.1em] uppercase font-mono text-neutral-500 mb-2">
                      Workshop Title *
                    </label>
                    <input
                      name="title"
                      type="text"
                      required
                      className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-[12px] font-mono text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors shadow-inner"
                      placeholder="Design Sprint Q1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.1em] uppercase font-mono text-neutral-500 mb-2">
                      Objective *
                    </label>
                    <textarea
                      name="objective"
                      required
                      rows={3}
                      className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-[12px] font-mono text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors resize-none shadow-inner"
                      placeholder="What do you want to accomplish?"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.1em] uppercase font-mono text-neutral-500 mb-2">
                      Max Participants
                    </label>
                    <input
                      name="maxParticipants"
                      type="number"
                      min={2}
                      max={100}
                      defaultValue={10}
                      className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-[12px] font-mono text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors shadow-inner"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <GlassButton
                      type="submit"
                      disabled={isCreating || !activeProjectId}
                      size="md"
                      className="flex-1"
                    >
                      {isCreating ? "CREATING..." : "CREATE"}
                    </GlassButton>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-8 py-4 bg-transparent border border-neutral-200 text-neutral-500 hover:text-black hover:border-black rounded-full font-mono text-[11px] tracking-[0.15em] uppercase transition-all duration-150 hover:scale-[0.98] active:scale-95"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Live Workshop */}
        {liveWorkshop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Circle className="w-2 h-2 fill-[#D33E33] text-[#D33E33] animate-pulse shadow-[0_0_8px_#D33E33]" />
              <span className="text-[10px] tracking-[0.15em] font-mono text-[#D33E33] uppercase">
                Live Now
              </span>
            </div>
            <div
              onClick={() => navigate(`/workshops/${liveWorkshop.id}`)}
              className="group relative p-8 rounded-3xl bg-white border border-neutral-200 border-b-[4px] cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            >
              <div className="absolute inset-0 bg-neutral-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start justify-between">
                <div>
                  <h2 className="text-[20px] font-mono font-bold tracking-[0.05em] uppercase text-black mb-2">
                    {liveWorkshop.title}
                  </h2>
                  <p className="text-[12px] font-mono text-neutral-500 max-w-xl">
                    {liveWorkshop.objective ||
                      "Interactive workshop session in progress"}
                  </p>
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-neutral-200">
                    <div className="flex items-center gap-2 text-[10px] tracking-[0.1em] font-mono text-neutral-400 uppercase">
                      <Users className="w-4 h-4" />
                      <span>0 participants</span>
                    </div>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="p-4 rounded-full bg-black text-white"
                >
                  <Play className="w-6 h-6 fill-current pl-1" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 border-b border-neutral-200 pb-6">
          <LiquidTabs
            layoutId="workshop-status-filter"
            tabs={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "scheduled", label: "Scheduled" },
              { value: "completed", label: "Completed" },
            ]}
            active={filter}
            onChange={(v) => setFilter(v as typeof filter)}
            size="sm"
          />
        </div>

        {/* Scheduled Workshops */}
        {scheduledWorkshops.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h3 className="text-[12px] font-mono tracking-[0.1em] uppercase text-black mb-6 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-400" />
              Upcoming Workshops
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scheduledWorkshops.map((workshop, index) => (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  index={index}
                  onClick={() => navigate(`/workshops/${workshop.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Past Workshops Timeline */}
        {pastWorkshops.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-[12px] font-mono tracking-[0.1em] uppercase text-black mb-6 flex items-center gap-3">
              <Clock className="w-4 h-4 text-neutral-400" />
              Past Sessions
            </h3>
            <div className="space-y-4">
              {pastWorkshops.map((workshop, index) => (
                <motion.div
                  key={workshop.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() => navigate(`/workshops/${workshop.id}`)}
                  className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-neutral-200 hover:border-black cursor-pointer transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                >
                  <div className="w-16 text-center shrink-0 border-r border-neutral-200 pr-6">
                    <div className="text-[10px] tracking-[0.1em] uppercase font-mono text-neutral-400 mb-1">
                      {format(
                        new Date(
                          workshop.scheduledStart || new Date().toISOString(),
                        ),
                        "MMM",
                      )}
                    </div>
                    <div className="text-[24px] font-header font-bold text-black leading-none">
                      {format(
                        new Date(
                          workshop.scheduledStart || new Date().toISOString(),
                        ),
                        "d",
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-mono font-bold tracking-[0.05em] uppercase text-black truncate mb-1">
                      {workshop.title}
                    </h4>
                    <p className="text-[10px] tracking-[0.1em] uppercase font-mono text-neutral-500">
                      {formatDistanceToNow(
                        new Date(
                          workshop.scheduledStart || new Date().toISOString(),
                        ),
                        { addSuffix: true },
                      )}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredWorkshops.length === 0 && (
          <div className="text-center py-20 px-6 border border-neutral-200 rounded-3xl bg-white">
            <MonitorPlay
              className="w-16 h-16 text-neutral-300 mx-auto mb-6"
              strokeWidth={1}
            />
            <p className="text-[14px] font-mono font-bold tracking-[0.05em] uppercase text-black mb-3">
              No workshops found
            </p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono max-w-sm mx-auto">
              Create your first workshop to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkshopCard({
  workshop,
  index,
  onClick,
}: {
  workshop: {
    id: string;
    title: string;
    objective?: string;
    scheduledStart?: string;
  };
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      onClick={onClick}
      className="group p-6 rounded-3xl bg-white border border-neutral-200 border-b-[3px] hover:border-black cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-full border border-neutral-200 group-hover:bg-neutral-50 transition-colors">
          <Calendar
            className="w-5 h-5 text-neutral-600 group-hover:text-black"
            strokeWidth={1.5}
          />
        </div>
        {workshop.scheduledStart && (
          <span className="text-[10px] tracking-[0.1em] uppercase font-mono text-neutral-500">
            {format(new Date(workshop.scheduledStart), "MMM d, h:mm a")}
          </span>
        )}
      </div>
      <h3 className="text-[16px] font-mono font-bold tracking-[0.05em] uppercase text-black mb-2 flex-grow">
        {workshop.title}
      </h3>
      <p className="text-[11px] font-mono text-neutral-500 line-clamp-2 mb-6">
        {workshop.objective || "Interactive workshop session"}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 mt-auto">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.1em] uppercase font-mono text-neutral-400">
          <Users className="w-4 h-4" />
          <span>0 participants</span>
        </div>
        <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors" />
      </div>
    </motion.div>
  );
}

export default WorkshopLiveSession;
