'use client';

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { cn } from '../../shared/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Scale,
  FileText,
  Users,
  Settings,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Command Palette
   Terminal-style command interface (Cmd+K)
   ═══════════════════════════════════════════════════════════════════════════ */

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  group: string;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');

  // Reset search when closing
  React.useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const commands: CommandItem[] = React.useMemo(() => [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => navigate('/'), group: 'Navigation' },
    { id: 'nav-messages', label: 'Go to Messages', icon: MessageSquare, action: () => navigate('/messages'), group: 'Navigation' },
    { id: 'nav-projects', label: 'Go to Projects', icon: FolderKanban, action: () => navigate('/projects'), group: 'Navigation' },
    { id: 'nav-decisions', label: 'Go to Decisions', icon: Scale, action: () => navigate('/decisions'), group: 'Navigation' },
    { id: 'nav-documents', label: 'Go to Documents', icon: FileText, action: () => navigate('/documents'), group: 'Navigation' },
    { id: 'nav-workshops', label: 'Go to Workshops', icon: Users, action: () => navigate('/workshops'), group: 'Navigation' },
    { id: 'nav-settings', label: 'Go to Settings', icon: Settings, action: () => navigate('/settings'), group: 'Navigation' },
    
    // Actions
    { id: 'create-project', label: 'Create New Project', icon: Plus, shortcut: '⌘N', action: () => navigate('/projects?new=1'), group: 'Actions' },
    { id: 'create-doc', label: 'Create New Document', icon: FileText, action: () => navigate('/documents?new=1'), group: 'Actions' },
    { id: 'start-workshop', label: 'Start Workshop', icon: Users, action: () => navigate('/workshops?new=1'), group: 'Actions' },
    { id: 'ask-ai', label: 'Ask AI Assistant', icon: Sparkles, shortcut: '⌘⇧A', action: () => {}, group: 'Actions' },
  ], [navigate]);

  const handleSelect = (command: CommandItem) => {
    command.action();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-terminal-950/80 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Dialog */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg animate-slide-down">
        <Command
          className={cn(
            'bg-terminal-900 border border-terminal-700 rounded-lg shadow-lg',
            'overflow-hidden'
          )}
          shouldFilter={true}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-terminal-700">
            <Search className="w-4 h-4 text-terminal-500 flex-shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className={cn(
                'flex-1 h-12 bg-transparent text-sm font-mono',
                'text-terminal-200 placeholder:text-terminal-500',
                'focus:outline-none'
              )}
              autoFocus
            />
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-terminal-500 bg-terminal-800 border border-terminal-600 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-terminal-500 font-mono">
              No results found.
            </Command.Empty>

            {['Navigation', 'Actions'].map((group) => {
              const groupCommands = commands.filter(c => c.group === group);
              if (groupCommands.length === 0) return null;

              return (
                <Command.Group key={group} heading={group}>
                  <div className="px-3 py-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-terminal-500">
                      {group}
                    </span>
                  </div>
                  {groupCommands.map((command) => (
                    <Command.Item
                      key={command.id}
                      value={command.label}
                      onSelect={() => handleSelect(command)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded cursor-pointer',
                        'text-sm font-mono text-terminal-300',
                        'data-[selected=true]:bg-terminal-800 data-[selected=true]:text-terminal-100',
                        'transition-colors duration-100'
                      )}
                    >
                      <command.icon className="w-4 h-4 text-terminal-500" />
                      <span className="flex-1">{command.label}</span>
                      {command.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-terminal-500 bg-terminal-800 border border-terminal-600 rounded">
                          {command.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-terminal-700">
            <span className="text-[10px] font-mono text-terminal-500">
              ↑↓ Navigate • ↵ Select • ESC Close
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-terminal-500">
              <Sparkles className="w-3 h-3" />
              <span>AI-powered</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
