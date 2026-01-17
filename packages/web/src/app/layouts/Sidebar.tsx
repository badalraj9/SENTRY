'use client';

import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../shared/lib/utils';
import { Kbd, Avatar } from '../../shared/ui';
import { useAppSelector } from '../../store/hooks';
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Scale,
  FileText,
  Users,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Sidebar Component
   Terminal-style collapsible navigation
   ═══════════════════════════════════════════════════════════════════════════ */

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onCommandPaletteOpen: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Decisions', href: '/decisions', icon: Scale },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Workshops', href: '/workshops', icon: Users },
];

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle, onCommandPaletteOpen }: SidebarProps) {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <aside
      className={cn(
        'h-full flex flex-col',
        'bg-terminal-900 border-r border-terminal-700',
        'transition-all duration-200'
      )}
    >
      {/* Logo / Brand */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-terminal-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-mono font-semibold text-terminal-200 tracking-tight">
              SENTRY
            </span>
          </div>
        )}
        {collapsed && (
          <Zap className="w-5 h-5 text-accent mx-auto" />
        )}
      </div>

      {/* Command Palette Trigger */}
      <div className="p-2">
        <button
          onClick={onCommandPaletteOpen}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2',
            'text-terminal-500 hover:text-terminal-300',
            'bg-terminal-950 hover:bg-terminal-800',
            'border border-terminal-700 rounded',
            'transition-colors duration-150',
            collapsed && 'justify-center px-2'
          )}
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm font-mono flex-1 text-left">Search...</span>
              <Kbd>⌘K</Kbd>
            </>
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded',
                    'text-sm font-mono transition-colors duration-150',
                    isActive
                      ? 'bg-accent-muted text-accent border border-accent/20'
                      : 'text-terminal-400 hover:text-terminal-200 hover:bg-terminal-800 border border-transparent',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 py-2 border-t border-terminal-700">

        {/* User Profile Snippet */}
        {!collapsed && (
          <div className="mb-4 px-2 py-2 flex items-center gap-3 bg-terminal-950/50 rounded-lg border border-terminal-800">
            <Avatar fallback={user?.handle || 'OP'} size="sm" status="online" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-terminal-200 truncate">{user?.displayName || user?.handle || 'Operator'}</p>
              <p className="text-[10px] text-terminal-500 truncate">Level 5 Clearance</p>
            </div>
            <Settings className="w-4 h-4 text-terminal-500 cursor-pointer hover:text-terminal-300" />
          </div>
        )}

        <ul className="space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded',
                    'text-sm font-mono transition-colors duration-150',
                    isActive
                      ? 'bg-accent-muted text-accent border border-accent/20'
                      : 'text-terminal-400 hover:text-terminal-200 hover:bg-terminal-800 border border-transparent',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 mt-2 rounded',
            'text-sm font-mono transition-colors duration-150',
            'text-terminal-500 hover:text-terminal-300 hover:bg-terminal-800',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
