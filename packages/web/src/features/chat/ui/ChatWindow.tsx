'use client';

import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import TextareaAutosize from 'react-textarea-autosize';
import { useGetChatsQuery, useGetMessagesQuery, useSendMessageMutation } from '../../../shared/api/apiSlice';
import { useChatSocket } from '../model/useChatSocket';
import { useAppSelector } from '../../../store/hooks';
import { cn } from '../../../shared/lib/utils';
import { Badge, Skeleton } from '../../../shared/ui';
import { Send, Hash, Loader2, MessageSquare, Users, AlertCircle, RefreshCw } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ChatWindow Component
   Virtualized chat with real-time updates and optimistic sending
   ═══════════════════════════════════════════════════════════════════════════ */

export function ChatWindow() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [inputText, setInputText] = React.useState('');
  const virtuosoRef = React.useRef<any>(null);

  // RTK Query hooks
  const { data: chats = [], isLoading: chatsLoading } = useGetChatsQuery();
  const { data: messages = [], isLoading: messagesLoading, error: messagesError, refetch } = useGetMessagesQuery(chatId!, { skip: !chatId });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

  // Connect to WebSocket for real-time updates
  useChatSocket(chatId);

  // Get current chat info
  const currentChat = chats.find(c => c.id === chatId);

  // Handle send message
  const handleSend = async () => {
    if (!inputText.trim() || !chatId) return;

    const tempId = crypto.randomUUID();
    const content = inputText;
    setInputText(''); // Clear immediately for instant feel

    try {
      await sendMessage({ chatId, content, tempId }).unwrap();
    } catch (err) {
      console.error('Failed to send message:', err);
      // Optimistic update will roll back automatically
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex">
      {/* Chat List Sidebar */}
      <aside className="w-64 flex-none border-r border-terminal-700 flex flex-col bg-terminal-900">
        <div className="h-12 flex items-center px-4 border-b border-terminal-700">
          <span className="text-xs font-mono text-terminal-400 uppercase tracking-wider">Channels</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {chatsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-terminal-500 text-xs">
              No chats yet
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  active={chat.id === chatId}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-terminal-950">
        {chatId ? (
          <>
            {/* Chat Header */}
            <header className="h-12 flex-none border-b border-terminal-700 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-success" />
                <span className="font-mono text-sm text-terminal-200">
                  {currentChat?.name || chatId}
                </span>
                <Badge variant="default">{currentChat?.type || 'chat'}</Badge>
              </div>
              <div className="flex items-center gap-2 text-terminal-500">
                <Users className="w-4 h-4" />
              </div>
            </header>

            {/* Messages Area (Virtualized) */}
            <div className="flex-1 overflow-hidden">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-terminal-500" />
                </div>
              ) : messagesError ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <AlertCircle className="w-8 h-8 text-error" />
                  <p className="text-sm text-terminal-400">Failed to load messages</p>
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 text-xs text-accent hover:text-accent-hover"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageSquare className="w-12 h-12 text-terminal-700 mb-3" />
                  <p className="text-sm text-terminal-500">No messages yet</p>
                  <p className="text-xs text-terminal-600 mt-1">Start the conversation!</p>
                </div>
              ) : (
                <Virtuoso
                  ref={virtuosoRef}
                  data={messages}
                  initialTopMostItemIndex={messages.length - 1}
                  followOutput="auto"
                  className="h-full"
                  itemContent={(_index, message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isMe={message.userId === user?.id}
                    />
                  )}
                />
              )}
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-terminal-700">
              <div className={cn(
                'flex items-end gap-2 px-3 py-2',
                'bg-terminal-900 border border-terminal-700 rounded-md',
                'focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20',
                'transition-colors duration-150'
              )}>
                <TextareaAutosize
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  minRows={1}
                  maxRows={5}
                  className={cn(
                    'flex-1 bg-transparent resize-none',
                    'text-sm font-mono text-terminal-200 placeholder:text-terminal-500',
                    'focus:outline-none'
                  )}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    inputText.trim()
                      ? 'text-accent hover:bg-accent/10'
                      : 'text-terminal-600 cursor-not-allowed'
                  )}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex flex-col items-center justify-center">
            <MessageSquare className="w-16 h-16 text-terminal-700 mb-4" />
            <p className="text-terminal-400 font-mono">Select a conversation</p>
            <p className="text-terminal-600 text-sm mt-1">Or start a new chat</p>
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChatListItemProps {
  chat: { id: string; name?: string; type: string };
  active: boolean;
}

function ChatListItem({ chat, active }: ChatListItemProps) {
  return (
    <a
      href={`/messages/${chat.id}`}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded text-sm font-mono',
        'transition-colors duration-150',
        active
          ? 'bg-accent-muted text-accent border border-accent/20'
          : 'text-terminal-400 hover:text-terminal-200 hover:bg-terminal-800 border border-transparent'
      )}
    >
      <Hash className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{chat.name || chat.id.slice(0, 8)}</span>
    </a>
  );
}

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    userId: string;
    createdAt: string;
    status?: 'sending' | 'sent' | 'error';
  };
  isMe: boolean;
}

function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('px-4 py-1.5', isMe && 'flex justify-end')}>
      <div className={cn(
        'max-w-[70%] px-3 py-2 rounded-md',
        isMe
          ? 'bg-accent/10 border border-accent/20'
          : 'bg-terminal-900 border border-terminal-700'
      )}>
        <p className="text-sm text-terminal-200 whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-2 mt-1">
          <span className="text-[10px] text-terminal-500">{time}</span>
          {message.status === 'sending' && (
            <Loader2 className="w-2.5 h-2.5 animate-spin text-terminal-500" />
          )}
          {message.status === 'error' && (
            <AlertCircle className="w-2.5 h-2.5 text-error" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
