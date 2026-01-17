'use client';

import * as React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Hash,
  Volume2,
  Lock,
  ChevronDown,
  Plus,
  Settings,
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   Channel Sidebar
   Discord-style channel organization with categories
   ═══════════════════════════════════════════════════════════════════════════ */

type ChannelType = 'PUBLIC' | 'PRIVATE' | 'BROADCAST';

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

// Mock data structure
const CHANNEL_SECTIONS: ChannelSection[] = [
  {
    title: 'Broadcasts',
    channels: [
      { id: 'announcements', name: 'announcements', type: 'BROADCAST', unreadCount: 1 },
      { id: 'releases', name: 'releases', type: 'BROADCAST' },
    ],
  },
  {
    title: 'Engineering',
    channels: [
      { id: 'frontend', name: 'frontend-dev', type: 'PUBLIC' },
      { id: 'backend', name: 'backend-api', type: 'PUBLIC' },
      { id: 'ops', name: 'devops', type: 'PRIVATE' },
    ],
  },
  {
    title: 'Product',
    channels: [
      { id: 'design', name: 'design-system', type: 'PUBLIC' },
      { id: 'general', name: 'general', type: 'PUBLIC' },
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
    channel.type === 'BROADCAST'
      ? Volume2
      : channel.type === 'PRIVATE'
        ? Lock
        : Hash;

  return (
    <NavLink
      to={`/channels/${channel.id}`}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors mb-0.5',
        isActive
          ? 'bg-terminal-800 text-terminal-100'
          : 'text-terminal-400 hover:bg-terminal-900 hover:text-terminal-300'
      )}
    >
      <Icon
        size={14}
        className={cn(
          channel.type === 'BROADCAST' ? 'text-warning' : 'opacity-70'
        )}
      />
      <span className="truncate flex-1">{channel.name}</span>
      {channel.unreadCount && channel.unreadCount > 0 && (
        <span className="ml-auto bg-success text-terminal-950 text-[10px] font-bold px-1.5 rounded-full">
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
    status: 'online' | 'away' | 'offline';
  };
}

export function ChannelSidebar({ currentUser }: ChannelSidebarProps) {
  const { channelId } = useParams<{ channelId: string }>();
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(new Set());

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

  const user = currentUser || { handle: 'DevUser_26', status: 'online' as const };

  return (
    <div className="w-60 bg-terminal-950 border-r border-terminal-800 flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        'h-14 border-b border-terminal-800 flex items-center px-4',
        'font-bold text-terminal-100 hover:bg-terminal-900 transition-colors cursor-pointer'
      )}>
        <span>Sentry HQ</span>
        <ChevronDown size={14} className="ml-auto text-terminal-500" />
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-3">
        {CHANNEL_SECTIONS.map((section) => {
          const isCollapsed = collapsedSections.has(section.title);

          return (
            <div key={section.title} className="mb-4">
              {/* Section Header */}
              <div className="flex items-center justify-between px-1 mb-1.5 group">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center gap-1 text-[11px] font-mono uppercase text-terminal-500 font-bold tracking-wider hover:text-terminal-400"
                >
                  <ChevronDown
                    size={10}
                    className={cn(
                      'transition-transform',
                      isCollapsed && '-rotate-90'
                    )}
                  />
                  {section.title}
                </button>
                <button className="text-terminal-600 hover:text-terminal-300 opacity-0 group-hover:opacity-100 transition-all">
                  <Plus size={12} />
                </button>
              </div>

              {/* Channels */}
              {!isCollapsed && (
                <div className="animate-fade-in">
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
      <div className={cn(
        'h-14 bg-terminal-900/50 border-t border-terminal-800',
        'flex items-center px-3 gap-3'
      )}>
        <div className="w-8 h-8 rounded bg-success flex items-center justify-center font-bold text-xs text-terminal-950">
          {user.handle.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-xs font-medium text-terminal-100 truncate">
            {user.handle}
          </div>
          <div className="text-[10px] text-terminal-500 flex items-center gap-1">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              user.status === 'online' && 'bg-success',
              user.status === 'away' && 'bg-warning',
              user.status === 'offline' && 'bg-terminal-600'
            )} />
            <span className="capitalize">{user.status}</span>
          </div>
        </div>
        <button className="p-1.5 text-terminal-500 hover:text-terminal-300 transition-colors">
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}

export default ChannelSidebar;
