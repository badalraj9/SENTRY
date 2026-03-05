

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   SYSTEM LOG
   Animated log messages like the Login page
   Shows staggered, color-coded terminal output
   ═══════════════════════════════════════════════════════════════════════════ */

export interface LogMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  timestamp?: string;
}

interface SystemLogProps {
  messages: LogMessage[];
  maxHeight?: string;
  className?: string;
  showTimestamps?: boolean;
}

export function SystemLog({ 
  messages, 
  maxHeight = '200px',
  className,
  showTimestamps = false
}: SystemLogProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getTypeStyles = (type: LogMessage['type']) => {
    switch (type) {
      case 'success': return 'text-success';
      case 'error': return 'text-error';
      case 'warning': return 'text-warning';
      default: return 'text-terminal-400';
    }
  };

  const getPrefix = (type: LogMessage['type']) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return 'ERR:';
      case 'warning': return 'WARN:';
      default: return '>';
    }
  };

  return (
    <div 
      ref={scrollRef}
      className={cn(
        'overflow-y-auto font-mono text-sm space-y-1 p-3 bg-terminal-950',
        className
      )}
      style={{ maxHeight }}
    >
      {messages.map((msg, i) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.02, duration: 0.15 }}
          className={cn('flex gap-2', getTypeStyles(msg.type))}
        >
          {showTimestamps && msg.timestamp && (
            <span className="text-terminal-600 text-xs">[{msg.timestamp}]</span>
          )}
          <span className="text-terminal-500">{getPrefix(msg.type)}</span>
          <span>{msg.text}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default SystemLog;
