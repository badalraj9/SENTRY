import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../shared/lib/utils';
import { Kbd } from '../../shared/ui';
import { useAppSelector } from '../../store/hooks';

/* ═══════════════════════════════════════════════════════════════════════════
   Sidebar Component
   Terminal-style collapsible navigation matching login page aesthetic
   ═══════════════════════════════════════════════════════════════════════════ */

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onCommandPaletteOpen: () => void;
}

// Terminal-style ASCII icons instead of Lucide icons
const navIcons: Record<string, string> = {
  Dashboard: '□',
  Messages: '✉',
  Projects: '▤',
  Decisions: '⚖',
  Documents: '▦',
  Workshops: '☰',
  Settings: '⚙',
};

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Messages', href: '/messages' },
  { name: 'Projects', href: '/projects' },
  { name: 'Decisions', href: '/decisions' },
  { name: 'Documents', href: '/documents' },
  { name: 'Workshops', href: '/workshops' },
];

const bottomNavigation = [
  { name: 'Settings', href: '/settings' },
];

export function Sidebar({ collapsed, onToggle, onCommandPaletteOpen }: SidebarProps) {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <aside
      className={cn(
        'h-full flex flex-col',
        'bg-terminal-950 border-r border-terminal-800',
        'transition-all duration-200 font-mono text-sm'
      )}
    >
      {/* Logo / Brand - Minimal like login page */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-terminal-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-400">⚡</span>
            <span className="font-semibold text-terminal-200 tracking-wider">
              SENTRY
            </span>
          </div>
        )}
        {collapsed && (
          <span className="text-terminal-400 mx-auto">⚡</span>
        )}
      </div>

      {/* Command Palette Trigger - Terminal style input */}
      <div className="p-3">
        <button
          onClick={onCommandPaletteOpen}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-1.5',
            'text-terminal-500 hover:text-terminal-300',
            'border border-terminal-800',
            'transition-colors duration-150',
            collapsed && 'justify-center px-2'
          )}
        >
          <span className="text-terminal-600">⌕</span>
          {!collapsed && (
            <>
              <span className="text-xs flex-1 text-left">search...</span>
              <Kbd>⌘K</Kbd>
            </>
          )}
        </button>
      </div>

      {/* Main Navigation - Clean terminal style */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-1.5',
                    'text-xs transition-colors duration-150',
                    isActive
                      ? 'text-accent border-l-2 border-accent bg-terminal-900/50'
                      : 'text-terminal-400 hover:text-terminal-200 hover:bg-terminal-900/30',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <span className="text-terminal-500 w-4 text-center">
                    {navIcons[item.name]}
                  </span>
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 py-2 border-t border-terminal-800">

        {/* User Profile Snippet - Text based, no avatar */}
        {!collapsed && (
          <div className="mb-3 px-3 py-2 border border-terminal-800 bg-terminal-900/30">
            <div className="flex items-center gap-2">
              <span className="text-terminal-500 text-xs">⦿</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-terminal-300 truncate">
                  {user?.handle || 'operator'}
                </p>
                <p className="text-[10px] text-terminal-600 truncate">
                  L5 clearance
                </p>
              </div>
            </div>
          </div>
        )}

        <ul className="space-y-0.5">
          {bottomNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-1.5',
                    'text-xs transition-colors duration-150',
                    isActive
                      ? 'text-accent border-l-2 border-accent bg-terminal-900/50'
                      : 'text-terminal-400 hover:text-terminal-200 hover:bg-terminal-900/30',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <span className="text-terminal-500 w-4 text-center">
                    {navIcons[item.name]}
                  </span>
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Collapse Toggle - Simple arrow */}
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-1.5 mt-2',
            'text-xs transition-colors duration-150',
            'text-terminal-600 hover:text-terminal-400',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? (
            <span>›</span>
          ) : (
            <>
              <span>‹</span>
              <span>collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
