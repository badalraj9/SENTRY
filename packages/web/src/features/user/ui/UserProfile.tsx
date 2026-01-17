'use client';

import { useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { cn } from '../../../shared/lib/utils';
import { Button, Badge, Kbd } from '../../../shared/ui';
import {
  Shield,
  Activity,
  Zap,
  Command,
  Key,
  LogOut,
  Copy,
  Check,
  Plus,
  Trash2,
  Bell,
  BellOff,
  Layout,
  Moon,
  Sun,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   USER PROFILE - THE DOSSIER
   Digital identity card with stats, shortcuts, and API tokens
   ═══════════════════════════════════════════════════════════════════════════ */

export default function UserProfile() {
  const { user } = useAppSelector((state) => state.auth);
  const [status, setStatus] = useState<'ONLINE' | 'FOCUS' | 'AWAY'>('ONLINE');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Mock data (replace with real API calls)
  const stats = {
    decisions: 142,
    documents: 38,
    workshops: 12,
    velocity: 'High',
    uptime: '98.2%',
  };

  const tokens = [
    { id: '1', name: 'CLI_Agent_01', lastUsed: '2m ago', created: '2 weeks ago' },
    { id: '2', name: 'GitHub_Action', lastUsed: '1d ago', created: '1 month ago' },
  ];

  const shortcuts = [
    { action: 'Quick Search', keys: '⌘K' },
    { action: 'AI Assistant', keys: '⌘J' },
    { action: 'New Document', keys: '⌘N' },
    { action: 'Toggle Sidebar', keys: '⌘B' },
    { action: 'Toggle Theme', keys: '⌘\\' },
    { action: 'Command Palette', keys: '⌘P' },
  ];

  const handleCopyToken = (id: string) => {
    // Mock copy
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
        {/* ═══════════════════════════════════════════════════════════════════
            THE ID CARD HEADER
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-terminal-900 border border-terminal-700 p-6 rounded-lg relative overflow-hidden">
          {/* Holographic glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-success/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-start gap-6 relative z-10">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 bg-terminal-800 rounded-lg border-2 border-terminal-600 flex items-center justify-center">
                <span className="text-2xl font-mono font-bold text-terminal-400">
                  {(user?.displayName || user?.handle || 'OP').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-terminal-900',
                  status === 'ONLINE' && 'bg-success',
                  status === 'FOCUS' && 'bg-warning',
                  status === 'AWAY' && 'bg-terminal-500'
                )}
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-semibold text-terminal-100">
                    {user?.displayName || user?.handle || 'Operator'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="w-3.5 h-3.5 text-success" />
                    <Badge variant="success">L4_ARCHITECT</Badge>
                    <span className="text-[10px] text-terminal-500 font-mono">
                      ID: {user?.id?.slice(0, 8) || '---'}
                    </span>
                  </div>
                  <p className="text-xs text-terminal-500 mt-2">{user?.email}</p>
                </div>
                <Button variant="danger" size="sm" className="gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </Button>
              </div>

              {/* Status Selector */}
              <div className="flex gap-2 mt-4">
                {(['ONLINE', 'FOCUS', 'AWAY'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      'px-3 py-1.5 text-[10px] font-mono rounded border transition-all',
                      status === s
                        ? 'bg-terminal-800 border-terminal-600 text-terminal-200'
                        : 'border-terminal-700 text-terminal-500 hover:text-terminal-300'
                    )}
                  >
                    {s === 'FOCUS' && <BellOff className="w-3 h-3 inline mr-1" />}
                    {s === 'ONLINE' && <Bell className="w-3 h-3 inline mr-1" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-5 gap-3 mt-6 pt-6 border-t border-terminal-700">
            <StatBox icon={Activity} label="Decisions" value={stats.decisions.toString()} />
            <StatBox icon={Activity} label="Documents" value={stats.documents.toString()} />
            <StatBox icon={Activity} label="Workshops" value={stats.workshops.toString()} />
            <StatBox icon={Zap} label="Velocity" value={stats.velocity} highlight />
            <StatBox icon={Activity} label="Uptime" value={stats.uptime} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTROL GRID
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-6">
          {/* Keybindings */}
          <div className="bg-terminal-900 border border-terminal-700 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 text-terminal-400">
              <Command className="w-4 h-4" />
              <h3 className="text-sm font-medium">Neural Links (Shortcuts)</h3>
            </div>
            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.action} className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-terminal-400">{shortcut.action}</span>
                  <Kbd>{shortcut.keys}</Kbd>
                </div>
              ))}
            </div>
          </div>

          {/* API Tokens */}
          <div className="bg-terminal-900 border border-terminal-700 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 text-terminal-400">
              <Key className="w-4 h-4" />
              <h3 className="text-sm font-medium">Access Tokens</h3>
            </div>
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="p-3 bg-terminal-950 rounded border border-terminal-700 flex justify-between items-center"
                >
                  <div>
                    <div className="text-xs text-terminal-200 font-medium font-mono">
                      {token.name}
                    </div>
                    <div className="text-[10px] text-terminal-600 mt-0.5">
                      Last used: {token.lastUsed}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyToken(token.id)}
                      className="p-1.5 text-terminal-500 hover:text-terminal-300 hover:bg-terminal-800 rounded transition-colors"
                    >
                      {copiedToken === token.id ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button className="p-1.5 text-terminal-500 hover:text-error hover:bg-error/10 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="w-full py-2.5 border border-dashed border-terminal-600 text-terminal-500 text-xs font-mono rounded hover:bg-terminal-800 hover:text-terminal-300 transition-colors flex items-center justify-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Generate New Token
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PREFERENCES
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-terminal-900 border border-terminal-700 rounded-lg p-5">
          <h3 className="text-sm font-medium text-terminal-300 mb-4">Preferences</h3>
          <div className="space-y-4">
            <PreferenceToggle
              icon={Layout}
              label="Compact Mode"
              description="Reduce padding for high-density data"
              defaultChecked={false}
            />
            <PreferenceToggle
              icon={Moon}
              label="Dark Theme"
              description="Always use dark mode (default)"
              defaultChecked={true}
            />
            <PreferenceToggle
              icon={BellOff}
              label="Focus Mode"
              description="Mute all notifications"
              defaultChecked={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

function StatBox({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-terminal-950/50 p-3 rounded border border-terminal-700/50">
      <div className="text-[10px] text-terminal-500 uppercase font-mono font-semibold flex items-center gap-1 mb-1">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
      <div className={cn('text-lg font-mono font-semibold', highlight ? 'text-success' : 'text-terminal-200')}>
        {value}
      </div>
    </div>
  );
}

function PreferenceToggle({
  icon: Icon,
  label,
  description,
  defaultChecked,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-terminal-500 mt-0.5" />
        <div>
          <div className="text-sm text-terminal-200">{label}</div>
          <div className="text-[10px] text-terminal-500">{description}</div>
        </div>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={cn(
          'w-10 h-5 rounded-full transition-colors relative',
          checked ? 'bg-success' : 'bg-terminal-700'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-terminal-100 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
