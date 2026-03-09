import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import {
  useGetChatsQuery,
  useGetProjectsQuery,
  useGetDecisionsQuery,
  useGetWorkshopsQuery,
  useGetDocumentsQuery,
} from "../../shared/api/apiSlice";
import { formatDistanceToNow, format } from "date-fns";
import {
  Terminal,
  Shield,
  Radio,
  FolderKanban,
  MessageSquare,
  FileText,
  MonitorPlay,
  GitPullRequest,
  Calendar,
  TrendingUp,
  Zap,
  ChevronRight,
} from "lucide-react";
import { ActivityFeed } from "../feed/ui/ActivityFeed";
import { cn } from "../../shared/lib/utils";
import { GlassButton, LiquidTabs } from "../../shared/ui";

type ActivityType =
  | "BROADCAST"
  | "DECISION"
  | "WORKSHOP"
  | "DOCUMENT"
  | "PROJECT"
  | "CHAT";

interface Activity {
  id: string;
  type: ActivityType;
  user: string;
  title: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: projects = [] } = useGetProjectsQuery();
  const { data: chats = [] } = useGetChatsQuery();
  const { data: workshops = [] } = useGetWorkshopsQuery(
    { projectId: "" },
    { skip: true },
  );
  const { data: documents = [] } = useGetDocumentsQuery(
    { projectId: "" },
    { skip: true },
  );
  const { data: decisions = [] } = useGetDecisionsQuery("", {
    skip: true,
  });

  const activities = useMemo<Activity[]>(() => {
    const items: Activity[] = [];

    projects.slice(0, 5).forEach((p) => {
      items.push({
        id: `proj-${p.id}`,
        type: "PROJECT",
        user: p.ownerId,
        title: p.name,
        content: p.description || "New project created",
        timestamp: new Date(p.createdAt),
        metadata: { visibility: p.visibility },
      });
    });

    workshops.slice(0, 3).forEach((w) => {
      items.push({
        id: `ws-${w.id}`,
        type: "WORKSHOP",
        user: "Host",
        title: w.title,
        content:
          w.status === "active"
            ? "Workshop is active now"
            : "Workshop scheduled",
        timestamp: new Date(w.scheduledStart || new Date().toISOString()),
        metadata: { status: w.status },
      });
    });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [projects, workshops]);

  const stats = [
    {
      label: "Projects",
      value: projects.length,
      icon: FolderKanban,
      color: "text-emerald-400",
    },
    {
      label: "Channels",
      value: chats.length,
      icon: MessageSquare,
      color: "text-blue-400",
    },
    {
      label: "Workshops",
      value: workshops.length,
      icon: MonitorPlay,
      color: "text-amber-400",
    },
  ];

  const upcomingWorkshops = workshops
    .filter((w) => w.status === "scheduled")
    .slice(0, 3)
    .map((w) => ({
      id: w.id,
      title: w.title,
      scheduledAt: w.scheduledStart ? new Date(w.scheduledStart) : new Date(),
    }));

  return (
    <div className="h-full w-full bg-transparent overflow-hidden flex flex-col md:flex-row p-4 gap-4">
      {/* LEFT COLUMN: Navigation / Status (20%) */}
      <div className="w-full md:w-1/5 glass-card flex flex-col shrink-0 overflow-hidden">
        <div className="p-8 border-b border-neutral-200">
          <h2 className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono mb-4">
            SYSTEM STATUS
          </h2>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D33E33] animate-pulse-fast inline-block shadow-[0_0_8px_#D33E33]" />
            <span className="text-black tracking-widest uppercase font-bold text-[11px]">
              ONLINE
            </span>
          </div>
          <div className="mt-4 text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono">
            OPR:{" "}
            <span className="text-black font-bold">
              {user?.handle || "UNKNOWN"}
            </span>
          </div>
        </div>
        <div className="flex-1 p-8 flex flex-col justify-end">
          <div className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono mb-6">
            SHORTCUTS
          </div>
          <div className="space-y-4 font-mono text-xs">
            <div className="flex justify-between text-neutral-500 items-center">
              <span className="uppercase tracking-widest text-[10px]">
                Search
              </span>{" "}
              <span className="text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-1 flex items-center justify-center rounded-md">
                ^K
              </span>
            </div>
            <div className="flex justify-between text-neutral-500 items-center">
              <span className="uppercase tracking-widest text-[10px]">
                Assistant
              </span>{" "}
              <span className="text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-1 flex items-center justify-center rounded-md">
                ^J
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: Activity Pulse (60%) */}
      <div className="flex-1 glass-card flex flex-col min-w-0 overflow-hidden relative">
        <div className="p-6 border-b border-white/60 flex items-center gap-4 shrink-0 glass-header rounded-t-3xl">
          <div className="w-10 h-10 border border-neutral-200 shadow-inner rounded-full flex items-center justify-center bg-white">
            <Terminal className="w-4 h-4 text-black" strokeWidth={1.5} />
          </div>
          <h1 className="font-header text-[32px] font-bold tracking-widest text-black m-0 leading-none mt-1.5">
            ACTIVITY PULSE
          </h1>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden bg-transparent relative">
          <DashboardActivityFeed activities={activities} />
        </div>
      </div>

      {/* RIGHT COLUMN: Stats & Actions (20%) */}
      <div className="w-full md:w-1/5 flex flex-col shrink-0 gap-4">
        {/* Stats Card */}
        <div className="glass-card overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 border-b border-neutral-200">
            {stats.slice(0, 2).map((stat) => (
              <div
                key={stat.label}
                className="p-6 h-32 border-r border-neutral-200 last:border-r-0 flex flex-col justify-end gap-1"
              >
                <div className="text-[48px] font-header font-bold text-black leading-none tracking-tighter">
                  {stat.value}
                </div>
                <div className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 h-32 flex gap-4 items-end justify-between relative">
            <div className="flex flex-col gap-1 justify-end">
              <div className="text-[48px] font-header font-bold text-black leading-none tracking-tighter">
                {stats[2].value}
              </div>
              <div className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono">
                {stats[2].label}
              </div>
            </div>
            <div className="absolute top-6 right-6 w-12 h-12 border border-neutral-300 shadow-inner rounded-full flex items-center justify-center bg-neutral-50">
              <MonitorPlay className="w-5 h-5 text-black" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Actions & Upcoming Card */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col min-h-0">
          {/* Quick Actions */}
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono mb-6 px-2">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <QuickAction
                icon={FolderKanban}
                label="NEW PROJECT"
                onClick={() => navigate("/projects")}
              />
              <QuickAction
                icon={MessageSquare}
                label="OPEN CHAT"
                onClick={() => navigate("/chat")}
              />
            </div>
          </div>

          {/* Upcoming */}
          <div className="flex-1 p-8 overflow-y-auto min-h-[200px] border-t border-neutral-200">
            <h3 className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono mb-6">
              Upcoming
            </h3>
            {upcomingWorkshops.length === 0 ? (
              <div className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono">
                - NO WORKSHOPS -
              </div>
            ) : (
              <div className="space-y-6">
                {upcomingWorkshops.map((ws) => (
                  <div
                    key={ws.id}
                    className="cursor-pointer group flex flex-col gap-1"
                    onClick={() => navigate(`/workshops/${ws.id}`)}
                  >
                    <div className="text-sm font-sans tracking-wide text-neutral-600 group-hover:text-black transition-colors truncate">
                      {ws.title}
                    </div>
                    <div className="text-[10px] tracking-[0.1em] font-mono uppercase text-[#D33E33] transition-colors group-hover:text-black">
                      {format(ws.scheduledAt, "MMM d, HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <GlassButton
      onClick={onClick}
      size="md"
      className="w-full justify-between mb-2 rounded-2xl text-[10px]"
    >
      <span className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center bg-white/10">
          <Icon className="w-3.5 h-3.5 text-white/80" strokeWidth={1.5} />
        </div>
        <span className="tracking-[0.15em] uppercase font-mono pr-2">
          {label}
        </span>
      </span>
      <ChevronRight className="w-3 h-3 text-white/50" />
    </GlassButton>
  );
}

function DashboardActivityFeed({ activities }: { activities: Activity[] }) {
  const [filter, setFilter] = useState<ActivityType | "ALL">("ALL");

  const filteredActivities = activities.filter(
    (a) => filter === "ALL" || a.type === filter,
  );

  const filterOptions: { value: ActivityType | "ALL"; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "PROJECT", label: "Projects" },
    { value: "WORKSHOP", label: "Workshops" },
    { value: "DECISION", label: "Decisions" },
    { value: "DOCUMENT", label: "Docs" },
  ];

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Filter Bar */}
      <div className="flex items-center gap-4 px-8 py-4 border-b border-neutral-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <LiquidTabs
          layoutId="activity-feed-filter"
          tabs={filterOptions}
          active={filter}
          onChange={(v) => setFilter(v)}
          size="sm"
        />
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto relative min-h-[400px]">
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <Radio
              className="w-12 h-12 text-neutral-300 mb-6"
              strokeWidth={1.5}
            />
            <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono">
              NO ACTIVITY DETECTED
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredActivities.map((item, index) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedCard({ item }: { item: Activity }) {
  const timeAgo = formatDistanceToNow(item.timestamp, { addSuffix: true });

  const config = {
    PROJECT: { icon: FolderKanban },
    WORKSHOP: { icon: MonitorPlay },
    DECISION: { icon: GitPullRequest },
    DOCUMENT: { icon: FileText },
    CHAT: { icon: MessageSquare },
    BROADCAST: { icon: Radio },
  };

  const { icon: Icon } = config[item.type] || config.PROJECT;

  return (
    <div className="p-6 border-b border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer group flex gap-6">
      <div className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center bg-transparent text-neutral-500 group-hover:text-black group-hover:border-black/20 shrink-0 transition-colors">
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="text-[15px] font-sans tracking-wide text-neutral-800 group-hover:text-black transition-colors truncate font-medium">
            {item.title}
          </h3>
          <span className="text-[10px] font-mono text-neutral-500 group-hover:text-black shrink-0 uppercase tracking-[0.1em] transition-colors mt-0.5">
            {timeAgo}
          </span>
        </div>
        <p className="text-xs font-mono text-neutral-500 line-clamp-1 group-hover:text-neutral-900 transition-colors tracking-wide">
          {item.content}
        </p>
      </div>
    </div>
  );
}
