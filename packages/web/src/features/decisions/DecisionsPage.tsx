import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGetDecisionsQuery, useGetProjectsQuery } from '../../shared/api/apiSlice';
import { useAppSelector } from '../../store/hooks';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'header' | 'divider' | 'decision';
}

let globalKeyCounter = 0;
const generateKey = () => `log-${++globalKeyCounter}-${Date.now()}`;

export default function DecisionsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const bootStarted = useRef(false);
  const navigate = useNavigate();

  const { data: projects } = useGetProjectsQuery();
  const { data: decisions } = useGetDecisionsQuery(selectedProject || '', { skip: !selectedProject });

  // Boot sequence
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;

    const bootSequence: LogEntry[] = [
      { id: generateKey(), text: 'SENTRY_OS v4.0.2 [DECISIONS MODULE]', type: 'header' },
      { id: generateKey(), text: '═══════════════════════════════════════════════════════', type: 'divider' },
      { id: generateKey(), text: 'INIT: LOADING DECISIONS MODULE...', type: 'info' },
      { id: generateKey(), text: '✓ DECISION ENGINE ONLINE', type: 'success' },
      { id: generateKey(), text: '', type: 'info' },
      { id: generateKey(), text: '── SELECT PROJECT ─────────────────────────────────────', type: 'divider' },
      { id: generateKey(), text: '  Type "use <project_number>" to view decisions', type: 'info' },
      { id: generateKey(), text: '', type: 'info' },
    ];

    setLogs(bootSequence);
    
    const timer = setTimeout(() => {
      setIsBooting(false);
      inputRef.current?.focus();
    }, 400);
    
    return () => clearTimeout(timer);
  }, []);

  // Show projects when loaded
  useEffect(() => {
    if (!isBooting && projects && projects.length > 0 && !selectedProject) {
      const projectLogs: LogEntry[] = [
        { id: generateKey(), text: '── AVAILABLE PROJECTS ─────────────────────────────────', type: 'divider' },
      ];
      
      projects.forEach((proj, idx) => {
        projectLogs.push({ 
          id: generateKey(), 
          text: `  [${String(idx + 1).padStart(2, '0')}] ${proj.name}`, 
          type: 'info' 
        });
      });
      
      projectLogs.push({ id: generateKey(), text: '', type: 'info' });
      
      setLogs(prev => [...prev, ...projectLogs]);
    }
  }, [projects, isBooting, selectedProject]);

  // Show decisions when loaded
  useEffect(() => {
    if (selectedProject && decisions) {
      const decisionLogs: LogEntry[] = [
        { id: generateKey(), text: '── DECISION RECORDS ───────────────────────────────────', type: 'divider' },
      ];
      
      if (decisions.length === 0) {
        decisionLogs.push({ id: generateKey(), text: '  No decisions found.', type: 'warning' });
      } else {
        decisions.forEach((dec: any, idx: number) => {
          const status = dec.deprecated ? ' [DEPRECATED]' : '';
          decisionLogs.push({ 
            id: generateKey(), 
            text: `  [${String(idx + 1).padStart(2, '0')}] ${dec.statement?.substring(0, 50) || 'No statement'}${dec.statement?.length > 50 ? '...' : ''}${status}`, 
            type: dec.deprecated ? 'warning' : 'decision'
          });
        });
      }
      
      decisionLogs.push({ id: generateKey(), text: '', type: 'info' });
      decisionLogs.push({ id: generateKey(), text: 'SYSTEM READY. AWAITING COMMAND.', type: 'success' });
      decisionLogs.push({ id: generateKey(), text: '', type: 'info' });
      
      setLogs(prev => [...prev, ...decisionLogs]);
    }
  }, [decisions, selectedProject]);

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
        { id: generateKey(), text: '  list           → List available projects', type: 'info' },
        { id: generateKey(), text: '  use <n>        → Select project by number', type: 'info' },
        { id: generateKey(), text: '  back           → Return to dashboard', type: 'info' },
        { id: generateKey(), text: '  clear          → Clear terminal', type: 'info' },
        { id: generateKey(), text: '', type: 'info' }
      );
    } else if (cmd === 'list' || cmd === 'ls') {
      if (projects && projects.length > 0) {
        newLogs.push({ id: generateKey(), text: '── PROJECT LIST ────────────────────────────────────────', type: 'divider' });
        projects.forEach((proj, idx) => {
          newLogs.push({ 
            id: generateKey(), 
            text: `  [${String(idx + 1).padStart(2, '0')}] ${proj.name}`,
            type: 'info'
          });
        });
        newLogs.push({ id: generateKey(), text: '', type: 'info' });
      }
    } else if (cmd.startsWith('use ')) {
      const num = parseInt(cmd.replace('use ', '')) - 1;
      if (projects && num >= 0 && num < projects.length) {
        const project = projects[num];
        setSelectedProject(project.id);
        newLogs.push(
          { id: generateKey(), text: `→ SELECTED PROJECT: ${project.name}`, type: 'success' },
          { id: generateKey(), text: '  LOADING DECISIONS...', type: 'info' }
        );
      } else {
        newLogs.push({ id: generateKey(), text: 'ERR: INVALID PROJECT NUMBER', type: 'error' });
      }
    } else if (cmd === 'back' || cmd === 'home' || cmd === 'dashboard') {
      newLogs.push({ id: generateKey(), text: '→ RETURNING TO COMMAND CENTER...', type: 'success' });
      setLogs(prev => [...prev, ...newLogs]);
      setTimeout(() => navigate('/'), 300);
      return;
    } else if (cmd === 'clear') {
      setLogs([]);
      return;
    } else {
      newLogs.push({ id: generateKey(), text: `ERR: UNKNOWN COMMAND "${cmd}"`, type: 'error' });
    }
    
    setLogs(prev => [...prev, ...newLogs]);
  }, [command, projects, selectedProject, navigate]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'header': return 'text-emerald-400 font-bold';
      case 'divider': return 'text-terminal-600';
      case 'decision': return 'text-cyan-400';
      default: return 'text-terminal-400';
    }
  };

  return (
    <div className="h-full w-full bg-terminal-950 text-terminal-300 font-mono text-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-terminal-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-terminal-500">
          <span>⚖</span>
          <span className="text-xs uppercase tracking-wider">DECISIONS MODULE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-terminal-600 text-xs">
            {decisions?.length || 0} RECORDS
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
                <div
                  className="absolute top-0 h-5 w-2 bg-emerald-500 pointer-events-none animate-pulse"
                  style={{ left: `${command.length * 9.6}px` }}
                />
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
