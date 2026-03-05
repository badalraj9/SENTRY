import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { AssistantDrawer } from '../../features/assistant/ui/AssistantDrawer';
import { Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Dashboard Layout
   CSS Grid: Sidebar (collapsible) + Main content area
   ═══════════════════════════════════════════════════════════════════════════ */

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [assistantOpen, setAssistantOpen] = React.useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K (Palette), Cmd/Ctrl + J (AI)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey)) {
        if (e.key === 'k') {
          e.preventDefault();
          setCommandPaletteOpen(true);
        } else if (e.key === 'j') {
          e.preventDefault();
          setAssistantOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-terminal-950 relative">
      {/* CSS Grid Layout */}
      <div
        className="h-full grid transition-all duration-200"
        style={{
          gridTemplateColumns: sidebarCollapsed ? '64px 1fr' : '240px 1fr',
          gridTemplateRows: '1fr',
        }}
      >
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
        />

        {/* Main Content */}
        <main className="overflow-hidden flex flex-col bg-terminal-950 relative">
          <Outlet />

          {/* AI FAB (Floating Action Button) */}
          <button
            onClick={() => setAssistantOpen(true)}
            className="absolute bottom-6 right-6 p-4 rounded-full bg-accent text-terminal-950 shadow-lg shadow-accent/20 hover:scale-110 hover:shadow-accent/40 transition-all z-30 group"
          >
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-terminal-800 text-terminal-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-terminal-700">
              Ask AI (⌘J)
            </span>
          </button>
        </main>
      </div>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />

      {/* AI Assistant Drawer */}
      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}
