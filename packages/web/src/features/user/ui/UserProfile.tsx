import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../../store/hooks';
import { Terminal, Shield, Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   OPERATOR DOSSIER - TERMINAL PROFILE
   Full CLI-style profile experience matching Login/Register aesthetic
   ═══════════════════════════════════════════════════════════════════════════ */

interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'header' | 'divider' | 'classified';
}

export default function UserProfile() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const hasBooted = useRef(false);

  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock stats
  const stats = {
    decisions: 142,
    documents: 38,
    workshops: 12,
    messages: 1847,
    uptime: '99.2%',
    clearance: 'LEVEL 5',
  };

  // Boot sequence animation - runs only once
  useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;

    const bootSequence: LogEntry[] = [
      { id: '1', text: 'SENTRY_OS v4.0.2 [PERSONNEL DATABASE]', type: 'header' },
      { id: '2', text: '═══════════════════════════════════════════════════════', type: 'divider' },
      { id: '3', text: 'INIT: ACCESSING PERSONNEL FILE...', type: 'info' },
      { id: '4', text: 'AUTH: DECRYPTING BIOMETRIC DATA...', type: 'info' },
      { id: '5', text: '✓ IDENTITY VERIFIED', type: 'success' },
      { id: '6', text: '✓ FILE ACCESS GRANTED', type: 'success' },
      { id: '7', text: '', type: 'info' },
      { id: '8', text: '── OPERATOR DOSSIER ───────────────────────────────────', type: 'divider' },
      { id: '9', text: '', type: 'info' },
      { id: '10', text: `  HANDLE:        @${user?.handle || 'unknown'}`, type: 'info' },
      { id: '11', text: `  DISPLAY_NAME:  ${user?.displayName || 'Commander'}`, type: 'info' },
      { id: '12', text: `  EMAIL:         ${user?.email || 'classified@sentry.os'}`, type: 'info' },
      { id: '13', text: `  OPERATOR_ID:   ${user?.id?.slice(0, 8) || 'UNKNOWN'}...`, type: 'info' },
      { id: '14', text: `  CLEARANCE:     ${stats.clearance}`, type: 'success' },
      { id: '15', text: `  STATUS:        ACTIVE`, type: 'success' },
      { id: '16', text: '', type: 'info' },
      { id: '17', text: '── ACTIVITY METRICS ───────────────────────────────────', type: 'divider' },
      { id: '18', text: '', type: 'info' },
      { id: '19', text: `  DECISIONS_MADE:     ${stats.decisions}`, type: 'info' },
      { id: '20', text: `  DOCUMENTS_CREATED:  ${stats.documents}`, type: 'info' },
      { id: '21', text: `  WORKSHOPS_LED:      ${stats.workshops}`, type: 'info' },
      { id: '22', text: `  MESSAGES_SENT:      ${stats.messages}`, type: 'info' },
      { id: '23', text: `  SESSION_UPTIME:     ${stats.uptime}`, type: 'success' },
      { id: '24', text: '', type: 'info' },
      { id: '25', text: '── API TOKENS ─────────────────────────────────────────', type: 'divider' },
      { id: '26', text: '', type: 'info' },
      { id: '27', text: '  [1] CLI_Agent_01      (active, last used: 2m ago)', type: 'success' },
      { id: '28', text: '  [2] GitHub_Action     (active, last used: 1d ago)', type: 'success' },
      { id: '29', text: '  [3] Webhook_Handler   (expired)', type: 'warning' },
      { id: '30', text: '', type: 'info' },
      { id: '31', text: '── KEYBOARD SHORTCUTS ─────────────────────────────────', type: 'divider' },
      { id: '32', text: '', type: 'info' },
      { id: '33', text: '  ⌘K  Quick Search       ⌘J  AI Assistant', type: 'info' },
      { id: '34', text: '  ⌘N  New Document       ⌘B  Toggle Sidebar', type: 'info' },
      { id: '35', text: '  ⌘P  Command Palette    ⌘\\  Toggle Theme', type: 'info' },
      { id: '36', text: '', type: 'info' },
      { id: '37', text: '═══════════════════════════════════════════════════════', type: 'divider' },
      { id: '38', text: 'FILE ACCESS COMPLETE. AWAITING COMMAND.', type: 'success' },
      { id: '39', text: '', type: 'info' },
    ];

    // Staggered boot animation using recursive setTimeout
    let currentIndex = 0;
    
    const addNextLog = () => {
      if (currentIndex < bootSequence.length) {
        setLogs(prev => [...prev, bootSequence[currentIndex]]);
        currentIndex++;
        setTimeout(addNextLog, 35);
      } else {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    };
    
    addNextLog();
  }, []); // Empty deps - run once

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handle commands
  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !command.trim()) return;

    const cmd = command.toLowerCase().trim();
    setLogs(prev => [...prev, { id: Date.now().toString(), text: `cmd> ${command}`, type: 'info' }]);
    setCommand('');

    // Command routing
    if (cmd === 'help' || cmd === '?') {
      addLogs([
        { text: '', type: 'info' },
        { text: '── DOSSIER COMMANDS ───────────────────────────────────', type: 'divider' },
        { text: '  back       → Return to command center', type: 'info' },
        { text: '  tokens     → Manage API tokens', type: 'info' },
        { text: '  export     → Export profile data', type: 'info' },
        { text: '  settings   → System preferences', type: 'info' },
        { text: '  logout     → Terminate session', type: 'info' },
        { text: '  clear      → Clear terminal', type: 'info' },
        { text: '', type: 'info' },
      ]);
    } else if (cmd === 'back' || cmd === 'home') {
      addLogs([{ text: '→ RETURNING TO COMMAND CENTER...', type: 'success' }]);
      setTimeout(() => navigate('/'), 500);
    } else if (cmd === 'tokens') {
      addLogs([
        { text: '', type: 'info' },
        { text: '── TOKEN MANAGEMENT ───────────────────────────────────', type: 'divider' },
        { text: '  Commands: tokens new | tokens revoke <id>', type: 'info' },
        { text: '', type: 'info' },
      ]);
    } else if (cmd === 'tokens new') {
      const newToken = `sentry_${Math.random().toString(36).slice(2, 18)}`;
      addLogs([
        { text: '✓ NEW TOKEN GENERATED:', type: 'success' },
        { text: `  ${newToken}`, type: 'warning' },
        { text: '  ⚠ COPY NOW - WILL NOT BE SHOWN AGAIN', type: 'warning' },
        { text: '', type: 'info' },
      ]);
    } else if (cmd === 'export') {
      addLogs([
        { text: 'EXPORTING PROFILE DATA...', type: 'info' },
        { text: '✓ EXPORT COMPLETE: profile_export.json', type: 'success' },
        { text: '', type: 'info' },
      ]);
    } else if (cmd === 'settings') {
      addLogs([
        { text: '', type: 'info' },
        { text: '── SYSTEM PREFERENCES ─────────────────────────────────', type: 'divider' },
        { text: '  THEME:          DARK', type: 'info' },
        { text: '  NOTIFICATIONS:  ENABLED', type: 'success' },
        { text: '  FOCUS_MODE:     DISABLED', type: 'info' },
        { text: '  COMPACT_MODE:   DISABLED', type: 'info' },
        { text: '', type: 'info' },
      ]);
    } else if (cmd === 'clear') {
      setLogs([
        { id: '1', text: 'SENTRY_OS v4.0.2 [PERSONNEL DATABASE]', type: 'header' },
        { id: '2', text: '═══════════════════════════════════════════════════════', type: 'divider' },
        { id: '3', text: 'TERMINAL CLEARED.', type: 'success' },
        { id: '4', text: '', type: 'info' },
      ]);
    } else if (cmd === 'logout' || cmd === 'exit') {
      addLogs([
        { text: 'TERMINATING SESSION...', type: 'warning' },
        { text: 'GOODBYE, COMMANDER.', type: 'info' },
      ]);
      setTimeout(() => navigate('/login'), 1000);
    } else {
      addLogs([
        { text: `ERR: UNKNOWN COMMAND "${cmd}"`, type: 'error' },
        { text: 'TYPE "help" FOR AVAILABLE COMMANDS', type: 'info' },
      ]);
    }
  };

  const addLogs = (entries: Omit<LogEntry, 'id'>[]) => {
    const newLogs = entries.map((e, i) => ({
      ...e,
      id: `${Date.now()}-${i}`,
    }));
    setLogs(prev => [...prev, ...newLogs]);
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-success';
      case 'error': return 'text-error';
      case 'warning': return 'text-warning';
      case 'header': return 'text-success font-bold';
      case 'divider': return 'text-terminal-600';
      case 'classified': return 'text-error';
      default: return 'text-terminal-400';
    }
  };

  return (
    <div
      className="h-full w-full bg-terminal-950 text-success font-mono text-sm overflow-hidden flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="p-4 border-b border-terminal-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-terminal-500">
          <Terminal className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Personnel Database</span>
          <span className="text-terminal-700">•</span>
          <span className="text-success text-xs">@{user?.handle || 'unknown'}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-terminal-600 text-xs">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>CLEARANCE {stats.clearance}</span>
          </div>
          <div className="flex items-center gap-2 text-terminal-600 text-xs">
            <Shield className="w-3 h-3" />
            <span>CLASSIFIED</span>
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Logs */}
          <div className="space-y-0.5">
            {logs.filter(Boolean).map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.05 }}
                className={getLogColor(log.type)}
              >
                {log.text || '\u00A0'}
              </motion.div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Command Input */}
          {!isLoading && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-terminal-500">cmd&gt;</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleCommand}
                  className="bg-transparent border-none outline-none w-full text-terminal-100"
                  placeholder=""
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                {/* Blinking Cursor */}
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                  className="absolute top-0 h-5 w-2 bg-success pointer-events-none"
                  style={{ left: `${command.length * 9.6}px` }}
                />
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-success animate-pulse">
              <Loader2 className="animate-spin w-4 h-4" />
              <span>DECRYPTING FILE...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-terminal-800 text-center text-terminal-600 text-[10px]">
        SENTRY COLLABORATIVE OS • PERSONNEL FILE RESTRICTED
      </div>
    </div>
  );
}
