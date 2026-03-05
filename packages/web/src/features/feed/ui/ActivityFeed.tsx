import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  GitPullRequest,
  FileText,
  MonitorPlay,
  Megaphone,
  Filter,
  Radio,
} from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import { EmptyState } from "../../../shared/ui";

/* ═══════════════════════════════════════════════════════════════════════════
   Activity Feed ("The Pulse")
   Polymorphic feed rendering different card types
   ═══════════════════════════════════════════════════════════════════════════ */

type ActivityType = "BROADCAST" | "DECISION" | "WORKSHOP" | "DOCUMENT";

interface Activity {
  id: string;
  type: ActivityType;
  user: string;
  title: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// TODO: Replace with useGetFeedQuery() when feed API endpoint is available
const FEED_ACTIVITIES: Activity[] = [];

/* ═══════════════════════════════════════════════════════════════════════════
   Feed Card Component (Dumb)
   ═══════════════════════════════════════════════════════════════════════════ */

interface FeedCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: "emerald" | "blue" | "amber" | "purple";
  title: string;
  time: string;
  children: React.ReactNode;
}

const colorMap = {
  emerald: {
    icon: "text-success",
    border: "group-hover:border-success/50",
    bg: "bg-success-muted",
  },
  blue: {
    icon: "text-info",
    border: "group-hover:border-info/50",
    bg: "bg-info-muted",
  },
  amber: {
    icon: "text-warning",
    border: "group-hover:border-warning/50",
    bg: "bg-warning-muted",
  },
  purple: {
    icon: "text-accent",
    border: "group-hover:border-accent/50",
    bg: "bg-accent-muted",
  },
};

function FeedCard({ icon: Icon, color, title, time, children }: FeedCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        "flex gap-4 p-4 border-b border-terminal-800",
        "hover:bg-terminal-900/40 transition-colors group cursor-pointer",
      )}
    >
      <div
        className={cn(
          "mt-1 p-2 rounded-md bg-terminal-900 border border-terminal-800",
          colors.icon,
          colors.border,
          "transition-colors",
        )}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-sm font-medium text-terminal-200 truncate">
            {title}
          </h3>
          <span className="text-xs font-mono text-terminal-600 flex-shrink-0">
            {time}
          </span>
        </div>
        <div className="text-sm text-terminal-400 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Activity Feed Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function ActivityFeed() {
  const [filter, setFilter] = React.useState<ActivityType | "ALL">("ALL");

  const activities = FEED_ACTIVITIES.filter(
    (a: Activity) => filter === "ALL" || a.type === filter,
  );

  return (
    <div className="h-full flex flex-col bg-terminal-950">
      {/* Header */}
      <div className="p-6 border-b border-terminal-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-sans tracking-tight text-terminal-100">
              Activity Pulse
            </h1>
            <p className="text-terminal-500 text-sm mt-1">
              Updates across all your projects.
            </p>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-terminal-500" />
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as ActivityType | "ALL")
              }
              className={cn(
                "bg-terminal-900 border border-terminal-700 rounded px-2 py-1",
                "text-sm font-mono text-terminal-300",
                "focus:outline-none focus:border-terminal-600",
              )}
            >
              <option value="ALL">All Activity</option>
              <option value="BROADCAST">Broadcasts</option>
              <option value="DECISION">Decisions</option>
              <option value="WORKSHOP">Workshops</option>
              <option value="DOCUMENT">Documents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto">
          <div className="my-8">
            <EmptyState
              icon={Radio}
              title="No activity yet."
              description="Activity will appear here as your team collaborates."
            />
          </div>
        ) : (
          activities.map((item) => {
            const timeAgo = formatDistanceToNow(item.timestamp, {
              addSuffix: true,
            });

            switch (item.type) {
              case "BROADCAST":
                return (
                  <FeedCard
                    key={item.id}
                    icon={Megaphone}
                    color="emerald"
                    title={item.title}
                    time={timeAgo}
                  >
                    <p>{item.content}</p>
                  </FeedCard>
                );

              case "DECISION":
                const status = (item.metadata?.status as string) || "pending";
                const statusStyles =
                  status === "approved"
                    ? "text-success border-success/30"
                    : "text-warning border-warning/30";
                return (
                  <FeedCard
                    key={item.id}
                    icon={GitPullRequest}
                    color="blue"
                    title={item.title}
                    time={timeAgo}
                  >
                    <p>
                      Proposal by{" "}
                      <span className="text-terminal-300">{item.user}</span>.
                      Status:{" "}
                      <span
                        className={cn(
                          "font-mono text-xs border px-1 rounded uppercase",
                          statusStyles,
                        )}
                      >
                        {status}
                      </span>
                    </p>
                  </FeedCard>
                );

              case "WORKSHOP":
                return (
                  <FeedCard
                    key={item.id}
                    icon={MonitorPlay}
                    color="amber"
                    title={item.title}
                    time={timeAgo}
                  >
                    <p>{item.content}</p>
                    <button className="text-success hover:underline text-xs mt-1">
                      View Session Summary →
                    </button>
                  </FeedCard>
                );

              case "DOCUMENT":
                return (
                  <FeedCard
                    key={item.id}
                    icon={FileText}
                    color="purple"
                    title={item.title}
                    time={timeAgo}
                  >
                    <p>
                      Published by{" "}
                      <span className="text-terminal-300">{item.user}</span>.{" "}
                      {item.content}
                    </p>
                  </FeedCard>
                );

              default:
                return null;
            }
          })
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;
