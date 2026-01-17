'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../shared/lib/utils';
import { Bot, X, Send, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '../../../shared/ui';
import { useQueryAssistantMutation, useGetProjectsQuery } from '../../../shared/api/apiSlice';

/* ═══════════════════════════════════════════════════════════════════════════
   AI Assistant Drawer
   Connected to real backend via API
   ═══════════════════════════════════════════════════════════════════════════ */

interface AssistantDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AssistantDrawer({ open, onClose }: AssistantDrawerProps) {
  const [messages, setMessages] = React.useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Systems online. I am ready to assist with project management, code analysis, or drafting decisions.' }
  ]);
  const [input, setInput] = React.useState('');
  const [queryAssistant, { isLoading }] = useQueryAssistantMutation();
  const { data: projects = [] } = useGetProjectsQuery();
  const projectId = projects[0]?.id || 'mock-id';

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    try {
      // Attempt real API call
      const response = await queryAssistant({ query: userMsg, projectId }).unwrap();
      setMessages(prev => [...prev, { role: 'ai', text: response.answer }]);
    } catch (error) {
      // Fallback for demo if API fails
      console.warn('AI API failed, falling back to simulation', error);

      setTimeout(() => {
        let response = "I can help with that.";
        if (userMsg.toLowerCase().includes('roadmap')) {
          response = "I've analyzed the Q3 roadmap. Based on current velocity, we are on track for the Alpha release. I recommend scheduling a review for the 'User Auth' module.";
        } else if (userMsg.toLowerCase().includes('summary')) {
          response = "Generating summary for 'Neon DB Migration': \n\n• Objective: Reduce latency by 40% \n• Status: Vote Required \n• Risk: Low \n\nWould you like me to draft an approval notification?";
        } else {
          response = "I've updated the context graph with that information. Is there anything else you need assistance with?";
        }
        setMessages(prev => [...prev, { role: 'ai', text: response }]);
      }, 1500);
    }
  };

  // Use isLoading from API or local state if simulating
  const isTyping = isLoading;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed right-0 top-0 bottom-0 w-[400px] bg-terminal-950 border-l border-terminal-700 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-terminal-700 flex items-center justify-between bg-terminal-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-terminal-100 text-sm">SENTRY AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-terminal-400 font-mono uppercase">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-terminal-800 rounded-md text-terminal-400 hover:text-terminal-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                    msg.role === 'ai'
                      ? "bg-terminal-900 border-terminal-700 text-accent"
                      : "bg-terminal-800 border-terminal-600 text-terminal-300"
                  )}>
                    {msg.role === 'ai' ? <Bot size={16} /> : <div className="text-xs font-bold">OP</div>}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-lg p-3 text-sm leading-relaxed",
                    msg.role === 'ai'
                      ? "bg-terminal-900/50 border border-terminal-800 text-terminal-300"
                      : "bg-accent/10 border border-accent/20 text-terminal-100"
                  )}>
                    {msg.text.split('\n').map((line, j) => (
                      <p key={j} className={line ? "mb-1 last:mb-0" : "h-2"}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-terminal-900 border border-terminal-700 text-accent flex items-center justify-center flex-shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="bg-terminal-900/50 border border-terminal-800 rounded-lg p-4 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-terminal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-terminal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-terminal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-terminal-700 bg-terminal-900">
              <div className="flex gap-2">
                 <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask SENTRY to analyze, draft, or summarize..."
                  className="flex-1 bg-terminal-950 border border-terminal-700 rounded-md px-3 py-2 text-sm text-terminal-200 placeholder:text-terminal-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  autoFocus
                />
                <Button variant="primary" onClick={handleSend} disabled={!input.trim() || isTyping}>
                  <Send size={16} />
                </Button>
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {["Summarize recent decisions", "Draft update for investors", "Analyze roadmap risks"].map((hint, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(hint); }}
                    className="flex-shrink-0 text-[10px] px-2 py-1 rounded border border-terminal-700 bg-terminal-900 text-terminal-400 hover:text-terminal-200 hover:border-terminal-500 transition-colors whitespace-nowrap"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
