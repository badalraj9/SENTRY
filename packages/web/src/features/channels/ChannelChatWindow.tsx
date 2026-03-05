import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import TextareaAutosize from 'react-textarea-autosize';
import { useAppSelector } from '../../store/hooks';
import { cn } from '../../shared/lib/utils';
import { Badge } from '../../shared/ui';
import {
  Send,
  Hash,
  Volume2,
  Lock,
  MessageSquare,
  Users,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ChannelChatWindow Component
   Enhanced chat with broadcast room logic
   ═══════════════════════════════════════════════════════════════════════════ */

type ChannelType = 'PUBLIC' | 'PRIVATE' | 'BROADCAST';

interface ChannelInfo {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
}

interface Message {
  id: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
  status?: 'sending' | 'sent' | 'error';
}

// Mock channel data
const CHANNEL_DATA: Record<string, ChannelInfo> = {
  announcements: { id: 'announcements', name: 'announcements', type: 'BROADCAST', description: 'Official announcements only' },
  releases: { id: 'releases', name: 'releases', type: 'BROADCAST', description: 'Product release notes' },
  frontend: { id: 'frontend', name: 'frontend-dev', type: 'PUBLIC', description: 'Frontend development discussion' },
  backend: { id: 'backend', name: 'backend-api', type: 'PUBLIC', description: 'Backend API discussion' },
  ops: { id: 'ops', name: 'devops', type: 'PRIVATE', description: 'DevOps team channel' },
  design: { id: 'design', name: 'design-system', type: 'PUBLIC', description: 'Design system discussions' },
  general: { id: 'general', name: 'general', type: 'PUBLIC', description: 'General chatter' },
};

// Mock messages
const MOCK_MESSAGES: Message[] = [
  { id: '1', content: 'Welcome to the channel! 🎉', userId: 'system', userName: 'System', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '2', content: 'Hey everyone, excited to be here!', userId: 'user-1', userName: 'Alex Chen', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: '3', content: 'Just pushed the new updates to staging.', userId: 'user-2', userName: 'Jordan Lee', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
];

export function ChannelChatWindow() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [inputText, setInputText] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>(MOCK_MESSAGES);

  const channel = channelId ? CHANNEL_DATA[channelId] : null;

  // Broadcast room logic
  const isBroadcast = channel?.type === 'BROADCAST';
  // Check if user has admin role (cast to any to handle missing property)
  const userRole = (user as { role?: string } | null)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'ADMIN';
  const canSend = !isBroadcast || (isBroadcast && isAdmin);

  const handleSend = () => {
    if (!inputText.trim() || !canSend) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: inputText,
      userId: user?.id || 'me',
      userName: user?.handle || 'Me',
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const ChannelIcon = channel?.type === 'BROADCAST' 
    ? Volume2 
    : channel?.type === 'PRIVATE' 
      ? Lock 
      : Hash;

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-terminal-950">
        <MessageSquare className="w-16 h-16 text-terminal-700 mb-4" />
        <p className="text-terminal-400 font-mono">Select a channel</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-terminal-950">
      {/* Channel Header */}
      <header className="h-12 flex-none border-b border-terminal-700 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChannelIcon className={cn(
            'w-4 h-4',
            channel.type === 'BROADCAST' ? 'text-warning' : 'text-success'
          )} />
          <span className="font-mono text-sm text-terminal-200">
            {channel.name}
          </span>
          <Badge variant={channel.type === 'BROADCAST' ? 'warning' : 'default'}>
            {channel.type.toLowerCase()}
          </Badge>
          {channel.description && (
            <>
              <span className="text-terminal-600 mx-2">|</span>
              <span className="text-xs text-terminal-500">{channel.description}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-terminal-500">
          <Users className="w-4 h-4" />
          <span className="text-xs font-mono">24 online</span>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <Virtuoso
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          followOutput="auto"
          className="h-full"
          itemContent={(_index, message) => (
            <ChannelMessageBubble
              key={message.id}
              message={message}
              isMe={message.userId === user?.id || message.userId === 'me'}
            />
          )}
        />
      </div>

      {/* Input Area with Broadcast Logic */}
      <div className="p-3 border-t border-terminal-700">
        {canSend ? (
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
              placeholder={`Message #${channel.name}...`}
              minRows={1}
              maxRows={5}
              className={cn(
                'flex-1 bg-transparent resize-none',
                'text-sm font-mono text-terminal-200 placeholder:text-terminal-500',
                'focus:outline-none'
              )}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={cn(
                'p-1.5 rounded transition-colors',
                inputText.trim()
                  ? 'text-accent hover:bg-accent/10'
                  : 'text-terminal-600 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Broadcast Read-Only Indicator */
          <div className={cn(
            'h-12 flex items-center justify-center rounded-md',
            'bg-terminal-900 border border-terminal-800 border-dashed',
            'text-terminal-500 text-sm font-mono'
          )}>
            <Volume2 size={14} className="mr-2 text-warning" />
            Only admins can post in this channel.
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Channel Message Bubble
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChannelMessageBubbleProps {
  message: Message;
  isMe: boolean;
}

function ChannelMessageBubble({ message, isMe }: ChannelMessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="px-4 py-2 hover:bg-terminal-900/30 transition-colors group">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={cn(
          'w-8 h-8 rounded flex items-center justify-center flex-shrink-0',
          'text-xs font-bold',
          isMe ? 'bg-accent text-terminal-950' : 'bg-terminal-700 text-terminal-300'
        )}>
          {message.userName.slice(0, 2).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-sm font-medium',
              isMe ? 'text-accent' : 'text-terminal-200'
            )}>
              {message.userName}
            </span>
            <span className="text-[10px] text-terminal-600 font-mono">
              {time}
            </span>
          </div>
          <p className="text-sm text-terminal-300 mt-0.5 break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChannelChatWindow;
