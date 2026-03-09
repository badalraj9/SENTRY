import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "../../store/hooks";
import { cn } from "../../shared/lib/utils";
import {
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetChatMembersQuery,
  useGetThreadMessagesQuery,
  useGetUserQuery,
} from "../../shared/api/apiSlice";
import { 
  Send, 
  Hash, 
  Volume2, 
  Lock, 
  Users, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video,
  ChevronLeft,
  Search,
  Zap,
  MessageSquare,
  CornerDownRight,
  X,
  File,
  Image as ImageIcon
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   CHANNEL CHAT WINDOW (SPATIAL EXPANSION)
   The full-screen focused state of a channel capsule.
   ═══════════════════════════════════════════════════════════════════════════ */

const GLASS_STYLE = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.88)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,1)",
};

// Fallback users for @mention autocomplete (until we have a real users API)
const MOCK_USERS = [
  { id: "u1", name: "Alex Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
  { id: "u2", name: "Jordan Lee", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" },
  { id: "u3", name: "Sarah Ops", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
  { id: "u4", name: "Operator", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Operator" },
];

interface Message {
  id: string;
  userId?: string;
  user?: string;
  avatar?: string;
  content: string;
  time: string;
  isMe: boolean;
  isAI?: boolean;
  threadCount?: number;
  replyTo?: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: "m1", user: "SENTRY // AI", content: "Greetings, Operator. Node initialization complete. All neural pathways are synchronized.", time: "09:10 AM", isMe: false, isAI: true },
  { id: "m2", user: "Alex Chen", avatar: MOCK_USERS[0].avatar, content: "System initialization complete. Monitoring node traffic.", time: "09:12 AM", isMe: false, threadCount: 2 },
  { id: "m3", user: "Operator", avatar: MOCK_USERS[3].avatar, content: "Copy that. Proceed with frontend integration.", time: "09:14 AM", isMe: true },
  { id: "m4", user: "Jordan Lee", avatar: MOCK_USERS[1].avatar, content: "Deploying assets to the spatial grid. Looks smooth.", time: "09:15 AM", isMe: false },
];

export function ChannelChatWindow() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { user } = useAppSelector((state) => state.auth);

  // Real API data
  const { data: chats = [] } = useGetChatsQuery(undefined);
  const { data: messages = [], isLoading: messagesLoading } = useGetMessagesQuery(
    channelId || "",
    { skip: !channelId }
  );
  const { data: members = [] } = useGetChatMembersQuery(channelId || "", {
    skip: !channelId,
  });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

  // Find current chat
  const currentChat = chats.find((c) => c.id === channelId);

  // Get unique user IDs from messages
  const userIds = React.useMemo(() => {
    const ids = new Set<string>();
    messages.forEach(m => {
      if (m.userId) ids.add(m.userId);
    });
    return Array.from(ids);
  }, [messages]);

  // Map messages to UI format with usernames
  const uiMessages = React.useMemo(() => {
    return messages.map((msg) => ({
      id: msg.id,
      userId: msg.userId,
      user: msg.userId === user?.id ? "You" : `User`,
      content: msg.content,
      time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: msg.userId === user?.id,
      isAI: false,
      replyTo: msg.replyTo,
    }));
  }, [messages, user?.id]);

  const [inputText, setInputText] = React.useState("");
  
  // New UI States
  const [activeThread, setActiveThread] = React.useState<Message | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const [showEmoji, setShowEmoji] = React.useState(false);
  const [showAttachment, setShowAttachment] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);

  const channel = channelId ? {
    name: currentChat?.name || channelId,
    type: currentChat?.type || "PUBLIC",
    members: members?.length || 0,
    desc: currentChat?.visibility === "private" ? "Private channel" : "A secure channel"
  } : null;
  const Icon = channel?.type === 'BROADCAST' ? Volume2 : channel?.type === 'PRIVATE' ? Lock : Hash;

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Typing indicator simulation
    setIsTyping(val.length > 0);

    // Mention logic
    const lastWord = val.split(" ").pop() || "";
    if (lastWord.startsWith("@")) {
      setMentionQuery(lastWord.substring(1).toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !channelId) return;
    
    try {
      await sendMessage({
        chatId: channelId,
        content: inputText.trim(),
        tempId: Date.now().toString(),
      }).unwrap();
      
      setInputText("");
      setIsTyping(false);
      setShowEmoji(false);
      setShowAttachment(false);
      setMentionQuery(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertMention = (name: string) => {
    const words = inputText.split(" ");
    words.pop(); // Remove the typed @query
    setInputText([...words, `@${name} `].join(" ").trimStart());
    setMentionQuery(null);
  };

  return (
    <motion.div
      layoutId={`capsule-${channelId}`}
      className="h-full flex flex-col overflow-hidden rounded-[40px] shadow-2xl relative"
      style={GLASS_STYLE}
      initial={{ borderRadius: 40 }}
      animate={{ borderRadius: 40 }}
    >
      {/* ── Chat Header ── */}
      <header className="h-24 flex-none border-b border-black/5 px-10 flex items-center justify-between bg-white/40 backdrop-blur-md z-20">
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/messages")}
            className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center bg-white hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={18} />
          </motion.button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-lg relative">
              <Icon size={20} className="text-white" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-header text-2xl tracking-tighter text-black uppercase leading-none mt-1">
                  {channel?.name}
                </h1>
                <div className="px-2 py-0.5 rounded-md border border-neutral-200 text-[9px] font-mono text-neutral-400 uppercase tracking-widest bg-white/50">
                  {channel?.type}
                </div>
              </div>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <Users size={10} className="text-neutral-400" />
                {channel?.members} Members • {channel?.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <HeaderAction icon={Phone} label="Call" />
          <HeaderAction icon={Video} label="Video" />
          <div className="w-px h-6 bg-neutral-200 mx-2" />
          <HeaderAction icon={Search} label="Search" />
          <HeaderAction icon={MoreVertical} label="Settings" />
        </div>
      </header>

      {/* ── Main Layout Split (Messages | Thread) ── */}
      <div className="flex-1 overflow-hidden flex relative">
        
        {/* ── Messages Area ── */}
        <div 
          className="flex-1 overflow-y-auto p-10 custom-scrollbar flex flex-col relative z-0"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Welcome Message */}
          <div className="mb-12 text-center max-w-md mx-auto py-12 border-b border-black/5 border-dashed">
             <div className="w-20 h-20 rounded-[30px] bg-neutral-50 border border-neutral-200 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Icon size={32} className="text-neutral-300" />
             </div>
             <h2 className="font-header text-3xl text-black uppercase tracking-tighter mb-2">Beginning of #{channel?.name}</h2>
             <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest leading-relaxed">
               All transmissions in this node are encrypted and logged under SENTRY clearance level 5.
             </p>
          </div>

          {/* Messages */}
          <div className="space-y-8 pb-10">
            {messagesLoading ? (
              <div className="text-center py-12">
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Loading messages...</div>
              </div>
            ) : uiMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest">No messages yet</div>
              </div>
            ) : (
              uiMessages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  msg={msg} 
                  onThreadClick={() => setActiveThread(msg)}
                  isActiveThread={activeThread?.id === msg.id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-6 left-10 flex items-center gap-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest bg-white/80 px-4 py-2 rounded-full border border-black/5 shadow-sm"
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                Operator is typing...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Thread Sidebar ── */}
        <AnimatePresence>
          {activeThread && (
            <motion.div
              initial={{ width: 0, opacity: 0, borderLeftColor: "transparent" }}
              animate={{ width: 400, opacity: 1, borderLeftColor: "rgba(0,0,0,0.05)" }}
              exit={{ width: 0, opacity: 0, borderLeftColor: "transparent" }}
              className="h-full bg-white/40 backdrop-blur-md flex flex-col shrink-0 overflow-hidden border-l"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-black/5 bg-white/50 shrink-0">
                <div className="flex items-center gap-2 text-black font-header tracking-tighter text-lg mt-1 uppercase">
                  <MessageSquare size={16} /> Thread
                </div>
                <button 
                  onClick={() => setActiveThread(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 text-neutral-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <ChatMessage msg={activeThread} isThreadContext />
                <div className="my-6 border-b border-black/5" />
                <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest text-center">
                  End of thread history
                </p>
              </div>
              <div className="p-4 bg-white/60 border-t border-black/5 shrink-0">
                 <input 
                   placeholder="Reply in thread..." 
                   className="w-full bg-white border border-neutral-200 rounded-full px-4 py-2.5 text-xs font-mono outline-none focus:border-black/20 focus:shadow-sm transition-all"
                 />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Message Input (Capsule Style) ── */}
      <div className="p-6 bg-white/60 backdrop-blur-xl border-t border-black/5 flex justify-center relative z-20 shrink-0">
        <div className="max-w-[1200px] w-full relative">
          
          {/* @mention autocomplete popover */}
          <AnimatePresence>
            {mentionQuery !== null && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden p-2"
              >
                <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest px-3 mb-2 mt-1">Members</div>
                {MOCK_USERS.filter(u => u.name.toLowerCase().includes(mentionQuery)).map(user => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user.name)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 rounded-xl transition-colors text-left"
                  >
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full bg-neutral-100" />
                    <span className="text-xs font-mono uppercase tracking-wider text-black">{user.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachment Menu Popover */}
          <AnimatePresence>
            {showAttachment && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute bottom-full left-6 mb-4 bg-white border border-neutral-200 rounded-2xl shadow-xl p-2 flex flex-col gap-1 w-48"
              >
                <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 rounded-xl text-xs font-mono uppercase tracking-widest transition-colors"><File size={14} /> Document</button>
                <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 rounded-xl text-xs font-mono uppercase tracking-widest transition-colors"><ImageIcon size={14} /> Image/Video</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji Picker Popover */}
          <AnimatePresence>
            {showEmoji && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute bottom-full right-24 mb-4 bg-white border border-neutral-200 rounded-2xl shadow-xl p-4 w-64"
              >
                <div className="grid grid-cols-6 gap-2">
                  {['👍','🔥','❤️','👀','🚀','🎉','🤔','😂','🙌','💯','✅','✨'].map(emoji => (
                    <button key={emoji} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-lg text-lg transition-colors" onClick={() => setInputText(prev => prev + emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group flex items-end shadow-sm hover:shadow-md transition-shadow rounded-[30px] bg-white border border-neutral-200 focus-within:border-black/20">
            <div className="pl-4 pb-[18px] flex items-center gap-3 shrink-0">
               <button 
                 onClick={() => { setShowAttachment(!showAttachment); setShowEmoji(false); }}
                 className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", showAttachment ? "bg-black text-white" : "text-neutral-400 hover:text-black hover:bg-neutral-100")}
               >
                 <Paperclip size={16} strokeWidth={2} />
               </button>
               <div className="h-5 w-px bg-black/10" />
            </div>
            
            <TextareaAutosize
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channel?.name}...`}
              className="flex-1 bg-transparent py-[20px] px-4 outline-none font-mono text-[13px] text-black placeholder:text-neutral-300 resize-none min-h-[60px] max-h-40 overflow-y-auto custom-scrollbar leading-relaxed"
            />

            <div className="pr-4 pb-[12px] flex items-center gap-2 shrink-0">
               <button 
                 onClick={() => { setShowEmoji(!showEmoji); setShowAttachment(false); }}
                 className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-colors", showEmoji ? "bg-black text-white" : "text-neutral-400 hover:text-black hover:bg-neutral-100")}
               >
                 <Smile size={18} strokeWidth={2} />
               </button>
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={handleSend}
                 disabled={!inputText.trim()}
                 className="bg-black text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-black/10 disabled:opacity-30 disabled:grayscale transition-all h-9"
               >
                 <span className="text-[10px] font-header tracking-widest uppercase mt-0.5">Send</span>
                 <Send size={12} />
               </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HeaderAction({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="relative group">
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-black transition-colors"
      >
        <Icon size={18} strokeWidth={1.5} />
      </motion.button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[9px] font-mono uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
        {label}
      </div>
    </div>
  );
}

function ChatMessage({ 
  msg, 
  onThreadClick,
  isActiveThread,
  isThreadContext = false 
}: { 
  msg: Message; 
  onThreadClick?: () => void;
  isActiveThread?: boolean;
  isThreadContext?: boolean;
}) {
  const { isMe, isAI, user, content, time, avatar, threadCount } = msg;

  return (
    <div className={cn("flex flex-col gap-1.5 group relative", isMe ? "items-end" : "items-start")}>
      <div className="flex items-center gap-3 px-1">
        {!isMe && (
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold border transition-all duration-500 overflow-hidden shrink-0",
            isAI 
              ? "bg-black text-white border-black shadow-[0_0_12px_rgba(0,0,0,0.2)] group-hover:rotate-[360deg]" 
              : "bg-neutral-100 border-neutral-200"
          )}>
            {isAI ? <Zap size={14} className="fill-white" /> : (
               avatar ? <img src={avatar} alt={user} className="w-full h-full object-cover" /> : user[0]
            )}
          </div>
        )}
        <span className={cn(
          "text-[10px] font-mono uppercase tracking-widest flex items-center",
          isAI ? "text-black font-bold" : "text-neutral-500 font-semibold"
        )}>
          {user}
          {isAI && <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-black text-white rounded-sm">L5</span>}
        </span>
        <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-widest">{time}</span>
      </div>
      
      <div className={cn(
        "max-w-2xl px-6 py-4 rounded-[24px] relative transition-all duration-300",
        isMe 
          ? "bg-black text-white rounded-tr-none shadow-md" 
          : isAI
            ? "bg-white text-black border-2 border-black/5 rounded-tl-none shadow-xl"
            : "bg-white text-neutral-800 border border-neutral-200 rounded-tl-none shadow-sm hover:shadow-md",
        isActiveThread && !isThreadContext && "ring-2 ring-black/10 ring-offset-2"
      )}>
        {/* AI Pulsing Glow */}
        {isAI && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/[0.03] to-transparent animate-pulse pointer-events-none rounded-[24px]" />
        )}
        
        <p className="font-mono text-[13px] leading-[1.6] tracking-wide relative z-10 whitespace-pre-wrap">
          {content}
        </p>

        {/* Hover Actions Bar */}
        {!isThreadContext && (
          <div className={cn(
            "absolute -top-4 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white border border-neutral-200 rounded-full p-1 shadow-lg z-20",
            isMe ? "right-4" : "left-4"
          )}>
            <button className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black transition-colors" title="React">
               <Smile size={14} />
            </button>
            <button 
              className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black transition-colors" 
              onClick={onThreadClick}
              title="Reply in Thread"
            >
               <MessageSquare size={14} />
            </button>
            <div className="w-px h-4 bg-neutral-200 mx-0.5" />
            <button className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black transition-colors" title="More">
               <MoreVertical size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Thread Reply Indicator underneath message */}
      {!isThreadContext && threadCount && threadCount > 0 && (
        <button 
          onClick={onThreadClick}
          className={cn(
            "mt-1 flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest hover:text-black transition-colors px-2",
            isMe ? "self-end" : "self-start ml-10"
          )}
        >
          <CornerDownRight size={12} />
          {threadCount} {threadCount === 1 ? 'Reply' : 'Replies'}
        </button>
      )}
    </div>
  );
}

export default ChannelChatWindow;
