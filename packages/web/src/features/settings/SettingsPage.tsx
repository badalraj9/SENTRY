import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../../store/hooks';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'header' | 'divider' | 'setting';
}

let globalKeyCounter = 0;
const generateKey = () => `log-${++globalKeyCounter}-${Date.now()}`;

export default function SettingsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeSection, setActiveSection] = useState<'menu' | 'profile' | 'preferences' | 'security'>('menu');
  const [isBooting, setIsBooting] = useState(true);
  const bootStarted = useRef(false);
  const navigate = useNavigate();

  const { user } = useAppSelector((state) => state.auth);

  // Boot sequence
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;

    const bootSequence: LogEntry[] = [
      { id: generateKey(), text: 'SENTRY_OS v4.0.2 [SYSTEM SETTINGS]', type: 'header' },
      { id: generateKey(), text: '═══════════════════════════════════════════════════════', type: 'divider' },
      { id: generateKey(), text: 'INIT: LOADING CONFIGURATION MODULE...', type: 'info' },
      { id: generateKey(), text: '✓ SETTINGS ENGINE ONLINE', type: 'success' },
      { id: generateKey(), text: '', type: 'info' },
      { id: generateKey(), text: '── SETTINGS MENU ──────────────────────────────────────', type: 'divider' },
      { id: generateKey(), text: '  [1] Profile          → Edit user profile', type: 'setting' },
      { id: generateKey(), text: '  [2] Preferences      → Assistant preferences', type: 'setting' },
      { id: generateKey(), text: '  [3] Security         → Security settings', type: 'setting' },
      { id: generateKey(), text: '  [4] Back             → Return to dashboard', type: 'setting' },
      { id: generateKey(), text: '', type: 'info' },
    ];

    setLogs(bootSequence);
    
    const timer = setTimeout(() => {
      setIsBooting(false);
      inputRef.current?.focus();
    }, 400);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !command.trim()) return;

    const cmdText = command;
    const cmd = command.toLowerCase().trim();
    setCommand('');
    
    const newLogs: LogEntry[] = [
      { id: generateKey(), text: `sys> ${cmdText}`, type: 'info' }
    ];

    if (cmd === 'help' || cmd === '?') {
      newLogs.push(
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '── AVAILABLE COMMANDS ────────────────────────────────', type: 'divider' },
        { id: generateKey(), text: '  1, profile       → Edit user profile', type: 'info' },
        { id: generateKey(), text: '  2, preferences   → Assistant preferences', type: 'info' },
        { id: generateKey(), text: '  3, security      → Security settings', type: 'info' },
        { id: generateKey(), text: '  4, back          → Return to dashboard', type: 'info' },
        { id: generateKey(), text: '  menu             → Show main menu', type: 'info' },
        { id: generateKey(), text: '  clear            → Clear terminal', type: 'info' },
        { id: generateKey(), text: '', type: 'info' }
      );
    } else if (cmd === '1' || cmd === 'profile') {
      setActiveSection('profile');
      newLogs.push(
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '── USER PROFILE ───────────────────────────────────────', type: 'divider' },
        { id: generateKey(), text: `  HANDLE:    ${user?.handle || 'N/A'}`, type: 'info' },
        { id: generateKey(), text: `  EMAIL:     ${user?.email || 'N/A'}`, type: 'info' },
        { id: generateKey(), text: `  DISPLAY:   ${user?.displayName || 'N/A'}`, type: 'info' },
        { id: generateKey(), text: `  VISIBILITY: public`, type: 'info' },
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '  Commands:', type: 'info' },
        { id: generateKey(), text: '    edit    → Edit profile', type: 'info' },
        { id: generateKey(), text: '    menu    → Back to menu', type: 'info' },
        { id: generateKey(), text: '', type: 'info' }
      );
    } else if (cmd === '2' || cmd === 'preferences') {
      setActiveSection('preferences');
      newLogs.push(
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '── ASSISTANT PREFERENCES ──────────────────────────────', type: 'divider' },
        { id: generateKey(), text: '  Configure AI assistant behavior:', type: 'info' },
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '  [1] Verbosity      → quiet | balanced | verbose', type: 'setting' },
        { id: generateKey(), text: '  [2] Early Capture  → Enable/disable', type: 'setting' },
        { id: generateKey(), text: '  [3] Concise Mode   → Enable/disable', type: 'setting' },
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '  Commands:', type: 'info' },
        { id: generateKey(), text: '    menu    → Back to menu', type: 'info' },
        { id: generateKey(), text: '', type: 'info' }
      );
    } else if (cmd === '3' || cmd === 'security') {
      setActiveSection('security');
      newLogs.push(
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '── SECURITY SETTINGS ──────────────────────────────────', type: 'divider' },
        { id: generateKey(), text: '  Security configuration:', type: 'info' },
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '  [1] Change Password', type: 'setting' },
        { id: generateKey(), text: '  [2] Two-Factor Auth', type: 'setting' },
        { id: generateKey(), text: '  [3] API Tokens', type: 'setting' },
        { id: generateKey(), text: '  [4] Session Management', type: 'setting' },
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '  Commands:', type: 'info' },
        { id: generateKey(), text: '    menu    → Back to menu', type: 'info' },
        { id: generateKey(), text: '', type: 'info' }
      );
    } else if (cmd === '4' || cmd === 'back' || cmd === 'dashboard') {
      newLogs.push({ id: generateKey(), text: '→ RETURNING TO COMMAND CENTER...', type: 'success' });
      setLogs(prev => [...prev, ...newLogs]);
      setTimeout(() => navigate('/'), 300);
      return;
    } else if (cmd === 'menu') {
      setActiveSection('menu');
      newLogs.push(
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '── SETTINGS MENU ──────────────────────────────────────', type: 'divider' },
        { id: generateKey(), text: '  [1] Profile          → Edit user profile', type: 'setting' },
        { id: generateKey(), text: '  [2] Preferences      → Assistant preferences', type: 'setting' },
        { id: generateKey(), text: '  [3] Security         → Security settings', type: 'setting' },
        { id: generateKey(), text: '  [4] Back             → Return to dashboard', type: 'setting' },
        { id: generateKey(), text: '', type: 'info' }
      );
    } else if (cmd === 'clear') {
      setLogs([]);
      setActiveSection('menu');
      return;
    } else if (cmd === 'edit' && activeSection === 'profile') {
      newLogs.push(
        { id: generateKey(), text: '', type: 'info' },
        { id: generateKey(), text: '── EDIT PROFILE ───────────────────────────────────────', type: 'divider' },
        { id: generateKey(), text: '  Use the web form below to edit your profile.', type: 'info' },
        { id: generateKey(), text: '', type: 'info' }
      );
    } else {
      newLogs.push({ id: generateKey(), text: `ERR: UNKNOWN COMMAND "${cmd}"`, type: 'error' });
    }
    
    setLogs(prev => [...prev, ...newLogs]);
  }, [command, user, activeSection, navigate]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'header': return 'text-emerald-400 font-bold';
      case 'divider': return 'text-terminal-600';
      case 'setting': return 'text-cyan-400';
      default: return 'text-terminal-400';
    }
  };

  return (
    <div className="h-full w-full bg-terminal-950 text-terminal-300 font-mono text-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-terminal-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-terminal-500">
          <span>⚙</span>
          <span className="text-xs uppercase tracking-wider">SYSTEM SETTINGS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-terminal-600 text-xs">
            {user?.handle || 'guest'}
          </span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-6 overflow-y-auto" onClick={() => inputRef.current?.focus()}>
        <div className="max-w-4xl mx-auto">
          {/* Logs */}
          <div className="space-y-0.5">
            {logs.filter(Boolean).map((log) => (
              <div key={log.id} className={getLogColor(log.type)}>
                {log.text || '\u00A0'}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Profile Edit Form */}
          {activeSection === 'profile' && (
            <div className="mt-4 border border-terminal-800 p-4 bg-terminal-900/30">
              <h3 className="text-xs text-terminal-500 mb-3 uppercase">Edit Profile</h3>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setLogs(prev => [...prev, { id: generateKey(), text: '✓ PROFILE UPDATED', type: 'success' }]); }}>
                <div>
                  <label className="text-xs text-terminal-600 block mb-1">DISPLAY NAME</label>
                  <input type="text" defaultValue={user?.displayName || ''}
                    className="w-full bg-terminal-950 border border-terminal-700 px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
                    placeholder="Display name" />
                </div>
                <div>
                  <label className="text-xs text-terminal-600 block mb-1">BIO</label>
                  <textarea rows={2}
                    className="w-full bg-terminal-950 border border-terminal-700 px-3 py-1.5 text-sm focus:border-emerald-500 outline-none resize-none"
                    placeholder="Brief bio..." />
                </div>
                <div>
                  <label className="text-xs text-terminal-600 block mb-1">VISIBILITY</label>
                  <select defaultValue="public"
                    className="w-full bg-terminal-950 border border-terminal-700 px-3 py-1.5 text-sm focus:border-emerald-500 outline-none">
                    <option value="public">public</option>
                    <option value="limited">limited</option>
                    <option value="private">private</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-terminal-950 text-xs hover:bg-emerald-500">
                    SAVE
                  </button>
                  <button type="button" onClick={() => setActiveSection('menu')}
                    className="px-4 py-1.5 border border-terminal-700 text-xs hover:bg-terminal-800">
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Command Input */}
          {!isBooting && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-terminal-500">sys&gt;</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleCommand}
                  className="bg-transparent border-none outline-none w-full text-terminal-100"
                  placeholder="Type 'help' for commands..."
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="absolute top-0 h-5 w-2 bg-emerald-500 pointer-events-none animate-pulse"
                  style={{ left: `${command.length * 9.6}px` }} />
              </div>
            </div>
          )}

          {/* Booting indicator */}
          {isBooting && (
            <div className="mt-4 flex items-center gap-2 text-emerald-400 animate-pulse">
              <span>⟳</span>
              <span>LOADING MODULE...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-terminal-800 text-center text-terminal-600 text-[10px]">
        SENTRY COLLABORATIVE OS • TYPE "help" FOR COMMANDS
      </div>
    </div>
  );
}
