import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../shared/lib/utils';
import { Construction, ArrowRight, Terminal, Shield, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════
   Placeholder Page
   Terminal-style placeholder for features not yet implemented
   ═══════════════════════════════════════════════════════════════════════════ */

interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'header' | 'divider';
}

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const hasBooted = useRef(false);

  // Boot sequence
  useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;

    const bootSequence: LogEntry[] = [
      { id: '1', text: `SENTRY_OS v4.0.2 [${title.toUpperCase()} MODULE]`, type: 'header' },
      { id: '2', text: '═══════════════════════════════════════════════════════', type: 'divider' },
      { id: '3', text: `INIT: LOADING ${title.toUpperCase()} MODULE...`, type: 'info' },
      { id: '4', text: '⚠ FEATURE UNDER DEVELOPMENT', type: 'warning' },
      { id: '5', text: '', type: 'info' },
      { id: '6', text: '── MODULE STATUS ──────────────────────────────────────', type: 'divider' },
      { id: '7', text: `  Module:     ${title}`, type: 'info' },
      { id: '8', text: '  Status:     In Development', type: 'warning' },
      { id: '9', text: '  ETA:        Phase 2-4', type: 'info' },
      { id: '10', text: '  Priority:   Scheduled', type: 'info' },
      { id: '11', text: '', type: 'info' },
      { id: '12', text: '═══════════════════════════════════════════════════════', type: 'divider' },
      { id: '13', text: 'SYSTEM READY. AWAITING COMMAND.', type: 'success' },
      { id: '14', text: '', type: 'info' },
    ];

    let currentIndex = 0;
    const addNextLog = () => {
      if (currentIndex < bootSequence.length) {
        setLogs(prev => [...prev, bootSequence[currentIndex]]);
        currentIndex++;
        setTimeout(addNextLog, 50);
      } else {
        setIsBooting(false);
        inputRef.current?.focus();
      }
    };
    addNextLog();
  }, [title]);

  // Auto-scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handle commands
  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !command.trim()) return;

    const cmd = command.toLowerCase().trim();
    setLogs(prev => [...prev, { id: Date.now().toString(), text: `sys> ${command}`, type: 'info' }]);
    setCommand('');

    if (cmd === 'help' || cmd === '?') {
      setLogs(prev => [...prev, 
        { id: Date.now() + '1', text: '', type: 'info' },
        { id: Date.now() + '2', text: '── AVAILABLE COMMANDS ────────────────────────────────', type: 'divider' },
        { id: Date.now() + '3', text: '  back     → Return to dashboard', type: 'info' },
        { id: Date.now() + '4', text: '  status   → System status', type: 'info' },
        { id: Date.now() + '5', text: '  clear    → Clear terminal', type: 'info' },
        { id: Date.now() + '6', text: '', type: 'info' },
      ]);
    } else if (cmd === 'back' || cmd === 'home' || cmd === 'dashboard') {
      setLogs(prev => [...prev, { id: Date.now() + '1', text: '→ RETURNING TO COMMAND CENTER...', type: 'success' }]);
      setTimeout(() => window.history.back(), 500);
    } else if (cmd === 'status') {
      setLogs(prev => [...prev, 
        { id: Date.now() + '1', text: '', type: 'info' },
        { id: Date.now() + '2', text: '── SYSTEM STATUS ───────────────────────────────────', type: 'divider' },
        { id: Date.now() + '3', text: '  UPTIME:     99.7%', type: 'success' },
        { id: Date.now() + '4', text: '  MEMORY:     2.4GB / 8GB', type: 'info' },
        { id: Date.now() + '5', text: '  STATUS:     OPERATIONAL', type: 'success' },
        { id: Date.now() + '6', text: `  MODULE:     ${title} (DEVELOPMENT)`, type: 'warning' },
        { id: Date.now() + '7', text: '', type: 'info' },
      ]);
    } else if (cmd === 'clear' || cmd === 'cls') {
      setLogs([]);
    } else {
      setLogs(prev => [...prev, { id: Date.now() + '1', text: `ERR: UNKNOWN COMMAND "${cmd}"`, type: 'error' }]);
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-success';
      case 'error': return 'text-error';
      case 'warning': return 'text-warning';
      case 'header': return 'text-success font-bold';
      case 'divider': return 'text-terminal-600';
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
          <span className="text-xs uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-terminal-600 text-xs">
            <Construction className="w-3 h-3" />
            <span>DEVELOPMENT</span>
          </div>
          <div className="flex items-center gap-2 text-terminal-600 text-xs">
            <Shield className="w-3 h-3" />
            <span>SECURE</span>
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
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                  className="absolute top-0 h-5 w-2 bg-success pointer-events-none"
                  style={{ left: `${command.length * 9.6}px` }}
                />
              </div>
            </div>
          )}

          {/* Booting indicator */}
          {isBooting && (
            <div className="mt-4 flex items-center gap-2 text-success animate-pulse">
              <Loader2 className="animate-spin w-4 h-4" />
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
