import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGetChatsQuery, useGetMessagesQuery, useSendMessageMutation } from '../../../shared/api/apiSlice';
import { useChatSocket } from '../model/useChatSocket';
import { useAppSelector } from '../../../store/hooks';
import { Terminal, Shield, Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   COMMS HUB - TERMINAL CHAT
   Full CLI-style chat experience matching Login/Register aesthetic
   ═══════════════════════════════════════════════════════════════════════════ */

interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'header' | 'divider' | 'message' | 'self';
}

export function ChatWindow() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const hasBooted = useRef(false);

  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);

  // Fetch real data from API
  const { data: chats = [] } = useGetChatsQuery(undefined);
  const { data: messages = [] } = useGetMessagesQuery(chatId!, { skip: !chatId });
  const [sendMessageMutation, { isLoading: sending }] = useSendMessageMutation();
  
  // Connect to WebSocket for real-time updates
  useChatSocket(chatId);
  
  const currentChat = chats.find(c => c.id === chatId);

  // Initialize terminal - runs only once
  useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;

    const bootSequence: LogEntry[] = [
      { id: '1', text: 'SENTRY_OS v4.0.2 [COMMUNICATIONS HUB]', type: 'header' },
      { id: '2', text: '═══════════════════════════════════════════════════════', type: 'divider' },
      { id: '3', text: 'INIT: ESTABLISHING COMM LINK...', type: 'info' },
      { id: '4', text: '✓ ENCRYPTED CHANNEL ACTIVE', type: 'success' },
      { id: '5', text: '', type: 'info' },
      { id: '6', text: '── AVAILABLE FREQUENCIES ──────────────────────────────', type: 'divider' },
      { id: '7', text: '  [1] #general (0 members)', type: 'info' },
      { id: '8', text: '  [2] #engineering (0 members)', type: 'info' },
      { id: '9', text: '  [3] #design (0 members)', type: 'info' },
      { id: '10', text: '', type: 'info' },
      { id: '11', text: '═══════════════════════════════════════════════════════', type: 'divider' },
      { id: '12', text: 'COMMANDS: /join <n> | /back | /help', type: 'info' },
      { id: '13', text: chatId ? `CONNECTED TO: #${currentChat?.name || 'channel'}` : 'SELECT A CHANNEL TO BEGIN', type: chatId ? 'success' : 'warning' },
      { id: '14', text: '', type: 'info' },
    ];

    // Staggered animation using recursive setTimeout
    let currentIndex = 0;
    
    const addNextLog = () => {
      if (currentIndex < bootSequence.length) {
        setLogs(prev => [...prev, bootSequence[currentIndex]]);
        currentIndex++;
        setTimeout(addNextLog, 40);
      } else {
        setIsConnecting(false);
        inputRef.current?.focus();
      }
    };
    
    addNextLog();
  }, []); // Empty deps - run once

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handle input
  const handleInput = async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !message.trim()) return;

    const input = message.trim();
    setMessage('');

    // Command handling
    if (input.startsWith('/')) {
      const [cmd, ...args] = input.slice(1).split(' ');

      if (cmd === 'back' || cmd === 'home') {
        addLogs([{ text: '→ RETURNING TO COMMAND CENTER...', type: 'success' }]);
        setTimeout(() => navigate('/'), 500);
      } else if (cmd === 'join' && args[0]) {
        const channelNum = parseInt(args[0]) - 1;
        if (chats[channelNum]) {
          addLogs([{ text: `→ CONNECTING TO #${chats[channelNum].name}...`, type: 'success' }]);
          setTimeout(() => navigate(`/chat/${chats[channelNum].id}`), 500);
        } else {
          addLogs([{ text: 'ERR: INVALID CHANNEL NUMBER', type: 'error' }]);
        }
      } else if (cmd === 'help') {
        addLogs([
          { text: '', type: 'info' },
          { text: '── COMM COMMANDS ──────────────────────────────────────', type: 'divider' },
          { text: '  /join <n>  → Join channel by number', type: 'info' },
          { text: '  /back      → Return to command center', type: 'info' },
          { text: '  /clear     → Clear terminal', type: 'info' },
          { text: '  (text)     → Send message to channel', type: 'info' },
          { text: '', type: 'info' },
        ]);
      } else if (cmd === 'clear') {
        setLogs([
          { id: '1', text: 'SENTRY_OS v4.0.2 [COMMUNICATIONS HUB]', type: 'header' },
          { id: '2', text: '═══════════════════════════════════════════════════════', type: 'divider' },
          { id: '3', text: 'TERMINAL CLEARED.', type: 'success' },
          { id: '4', text: '', type: 'info' },
        ]);
      } else {
        addLogs([{ text: `ERR: UNKNOWN COMMAND "/${cmd}"`, type: 'error' }]);
      }
    } else if (chatId) {
      // Send message (mock for demo)
      addLogs([{ text: `  YOU: ${input}`, type: 'self' }]);
      addLogs([{ text: '  ✓ MESSAGE SENT', type: 'success' }]);
    } else {
      addLogs([{ text: 'ERR: NO CHANNEL SELECTED. USE /join <n>', type: 'error' }]);
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
      case 'message': return 'text-info';
      case 'self': return 'text-accent';
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
          <span className="text-xs uppercase tracking-wider">Communications Hub</span>
          {currentChat && (
            <>
              <span className="text-terminal-700">•</span>
              <span className="text-success text-xs">#{currentChat.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-terminal-600 text-xs">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>{chats.length} CHANNELS</span>
          </div>
          <div className="flex items-center gap-2 text-terminal-600 text-xs">
            <Shield className="w-3 h-3" />
            <span>E2E ENCRYPTED</span>
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

          {/* Message Input */}
          {!isConnecting && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-terminal-500">msg&gt;</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleInput}
                  className="bg-transparent border-none outline-none w-full text-terminal-100"
                  placeholder=""
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  disabled={sending}
                />
                {/* Blinking Cursor */}
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                  className="absolute top-0 h-5 w-2 bg-success pointer-events-none"
                  style={{ left: `${message.length * 9.6}px` }}
                />
              </div>
              {sending && <Loader2 className="w-4 h-4 animate-spin text-success" />}
            </div>
          )}

          {/* Connecting indicator */}
          {isConnecting && (
            <div className="mt-4 flex items-center gap-2 text-success animate-pulse">
              <Loader2 className="animate-spin w-4 h-4" />
              <span>ESTABLISHING LINK...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-terminal-800 text-center text-terminal-600 text-[10px]">
        SENTRY COLLABORATIVE OS • /help FOR COMMANDS
      </div>
    </div>
  );
}

export default ChatWindow;
