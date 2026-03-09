import * as React from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  Hash,
  Volume2,
  Lock,
  ChevronDown,
  Plus,
  Settings,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "../../shared/lib/utils";
import { NewChatDialog } from "./NewChatDialog";
import { useGetChatsQuery } from "../../shared/api/apiSlice";

/* ═══════════════════════════════════════════════════════════════════════════
   Channel Sidebar
   Discord-style channel organization with categories
   ═══════════════════════════════════════════════════════════════════════════ */

type ChannelType = "PUBLIC" | "PRIVATE" | "BROADCAST";

interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  unreadCount?: number;
}

interface ChannelSection {
  title: string;
  channels: Channel[];
}
        name: "announcements",
        type: "BROADCAST",
        unreadCount: 1,
      },
      { id: "releases", name: "releases", type: "BROADCAST" },
    ],
  },
  {
    title: "Engineering",
    channels: [
      { id: "frontend", name: "frontend-dev", type: "PUBLIC" },
      { id: "backend", name: "backend-api", type: "PUBLIC" },
      { id: "ops", name: "devops", type: "PRIVATE" },
    ],
  },
  {
    title: "Product",
    channels: [
      { id: "design", name: "design-system", type: "PUBLIC" },
      { id: "general", name: "general", type: "PUBLIC" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Channel Item Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
}

function ChannelItem({ channel, isActive }: ChannelItemProps) {
  const Icon =
    channel.type === "BROADCAST"
      ? Volume2
      : channel.type === "PRIVATE"
        ? Lock
        : Hash;

  return (
    <NavLink
      to={`/channels/${channel.id}`}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-4 px-6 py-3 font-mono text-[11px] tracking-widest uppercase transition-colors mr-4 rounded-r-full mb-1",
          isActive
            ? "bg-white/[0.05] text-white"
            : "text-neutral-500 hover:text-white hover:bg-white/[0.02]",
        )
      }
    >
      <Icon
        size={14}
        className={cn(
          "transition-colors",
          channel.type === "BROADCAST" ? "text-warning" : "text-inherit",
        )}
      />
      <span className="truncate flex-1 tracking-[0.15em]">{channel.name}</span>
      {channel.unreadCount && channel.unreadCount > 0 && (
        <span className="ml-auto bg-white text-black text-[9px] px-2 py-0.5">
          {channel.unreadCount}
        </span>
      )}
    </NavLink>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Channel Sidebar Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChannelSidebarProps {
  currentUser?: {
    handle: string;
    status: "online" | "away" | "offline";
  };
}

export function ChannelSidebar({ currentUser }: ChannelSidebarProps) {
  const { channelId } = useParams<{ channelId: string }>();
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(
    new Set(),
  );
  const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);

  // Fetch real chats from API
  const { data: chats = [], isLoading } = useGetChatsQuery(undefined);

  // Group chats by type
  const channelSections = React.useMemo(() => {
    const sections: ChannelSection[] = [];
    
    const publicChats = chats.filter(c => c.visibility === "public");
    const privateChats = chats.filter(c => c.visibility === "private");
    const broadcastChats = chats.filter(c => c.type === "workshop");
    
    if (publicChats.length > 0) {
      sections.push({
        title: "Channels",
        channels: publicChats.map(c => ({
          id: c.id,
          name: c.name || "unnamed",
          type: "PUBLIC" as ChannelType,
        })),
      });
    }
    
    if (privateChats.length > 0) {
      sections.push({
        title: "Private",
        channels: privateChats.map(c => ({
          id: c.id,
          name: c.name || "unnamed",
          type: "PRIVATE" as ChannelType,
        })),
      });
    }
    
    return sections;
  }, [chats]);

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const user = currentUser || {
    handle: "DevUser_26",
    status: "online" as const,
  };

  return (
    <div className="hidden md:flex w-80 bg-black border-r border-white/10 border-dashed flex-col h-full shrink-0">
      {/* Header */}
      <div
        className={cn(
          "h-24 border-b border-white/10 border-dashed flex items-center justify-between px-6 bg-transparent shrink-0",
          "font-header text-[22px] tracking-tighter text-white uppercase",
        )}
      >
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 opacity-50" />
          <span>COMMS NODE</span>
        </div>
        <button
          onClick={() => setIsNewChatOpen(true)}
          className="w-8 h-8 rounded-full border border-transparent hover:border-white/10 border-dashed text-neutral-500 hover:text-white transition-colors flex items-center justify-center"
          title="INITIALIZE COMM"
        >
          <Plus size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto bg-black">
        {isLoading ? (
          <div className="p-6 text-neutral-500 text-xs font-mono uppercase tracking-widest">
            Loading...
          </div>
        ) : channelSections.length === 0 ? (
          <div className="p-6 text-neutral-500 text-xs font-mono uppercase tracking-widest">
            No channels yet
          </div>
        ) : (
          channelSections.map((section) => {
            const isCollapsed = collapsedSections.has(section.title);

            return (
              <div
                key={section.title}
              className="border-b border-white/10 border-dashed pb-2"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-6 py-4 bg-transparent hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 text-micro text-neutral-500">
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200",
                      isCollapsed && "-rotate-90",
                    )}
                  />
                  {section.title}
                </div>
              </button>

              {/* Channels */}
              {!isCollapsed && (
                <div className="bg-black">
                  {section.channels.map((channel) => (
                    <ChannelItem
                      key={channel.id}
                      channel={channel}
                      isActive={channel.id === channelId}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Bar */}
      <div
        className={cn(
          "border-t border-white/10 border-dashed bg-transparent",
          "flex items-center p-6 gap-4",
        )}
      >
        <div className="w-12 h-12 rounded-full border border-white/10 border-dashed bg-white/[0.02] flex items-center justify-center font-header text-[20px] text-white">
          {user.handle.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="font-header text-[18px] tracking-wide text-white uppercase truncate">
            {user.handle}
          </div>
          <div className="text-[10px] tracking-[0.1em] text-neutral-500 uppercase flex items-center gap-2 mt-1">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                user.status === "online" &&
                  "bg-[#D33E33] animate-pulse shadow-[0_0_8px_#D33E33]",
                user.status === "away" && "bg-warning",
                user.status === "offline" && "bg-neutral-600",
              )}
            />
            <span>{user.status}</span>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full border border-transparent hover:border-white/10 border-dashed text-neutral-500 hover:text-white transition-colors flex items-center justify-center">
          <Settings size={18} strokeWidth={1.5} />
        </button>
      </div>

      <NewChatDialog
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />
    </div>
  );
}

export default ChannelSidebar;
