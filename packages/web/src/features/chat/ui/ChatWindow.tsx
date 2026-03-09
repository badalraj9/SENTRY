import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} from "../../../shared/api/apiSlice";
import { useChatSocket } from "../model/useChatSocket";
import { useAppSelector } from "../../../store/hooks";
import {
  Hash,
  Shield,
  Loader2,
  Send,
  X,
  Activity,
  MonitorPlay,
  FolderKanban,
} from "lucide-react";
import { ActivityFeed } from "../../feed/ui/ActivityFeed";
import { WorkshopPage } from "../../workshop";
import ProjectsPage from "../../projects/ProjectsPage";
import { EmptyState } from "../../../shared/ui";

/* ═══════════════════════════════════════════════════════════════════════════
   COMMS HUB
   Modern messaging interface with contextual floating command panels.
   ═══════════════════════════════════════════════════════════════════════════ */

type FloatingPanelTab = "none" | "feed" | "workshops" | "projects";

export function ChatWindow() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState("");
  const [activePanel, setActivePanel] = useState<FloatingPanelTab>("none");

  // Local state to simulate messages until backend wiring is complete
  const [localMessages, setLocalMessages] = useState<
    { id: string; text: string; sender: "me" | "other"; timestamp: number }[]
  >([]);

  // Fetch real data from API
  const { data: chats = [] } = useGetChatsQuery(undefined);
  // const { data: messages = [] } = useGetMessagesQuery(chatId!, { skip: !chatId });
  const [sendMessageMutation, { isLoading: sending }] =
    useSendMessageMutation();

  // Connect to WebSocket for real-time updates
  useChatSocket(chatId);

  const currentChat = chats.find((c) => c.id === chatId);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, activePanel]);

  // Handle commands and normal input
  const handleSend = async () => {
    if (!message.trim()) return;
    const input = message.trim();
    setMessage("");

    if (input.startsWith("/")) {
      const [cmd, ...args] = input.slice(1).split(" ");

      switch (cmd) {
        case "feed":
          setActivePanel("feed");
          break;
        case "workshops":
          setActivePanel("workshops");
          break;
        case "projects":
          setActivePanel("projects");
          break;
        case "back":
        case "home":
          navigate("/");
          break;
        case "join":
          if (args[0]) {
            const channelNum = parseInt(args[0]) - 1;
            if (chats[channelNum]) {
              setActivePanel("none");
              navigate(`/chat/${chats[channelNum].id}`);
            }
          }
          break;
        case "close":
          setActivePanel("none");
          break;
        default:
          // Unknown command just treated as message for now or handle Error
          setLocalMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: `Unknown command: /${cmd}`,
              sender: "other",
              timestamp: Date.now(),
            },
          ]);
          break;
      }
    } else if (chatId) {
      // Normal message
      setLocalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: input,
          sender: "me",
          timestamp: Date.now(),
        },
      ]);

      // Simulate reply
      setTimeout(() => {
        setLocalMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "Received. Tracking in central logs.",
            sender: "other",
            timestamp: Date.now(),
          },
        ]);
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Floating Panel Content Switcher
  const renderFloatingPanel = () => {
    switch (activePanel) {
      case "feed":
        return <ActivityFeed />;
      case "workshops":
        return <WorkshopPage />;
      case "projects":
        return <ProjectsPage />;
      default:
        return null;
    }
  };

  const getPanelIcon = () => {
    switch (activePanel) {
      case "feed":
        return <Activity className="w-4 h-4 text-[#666666]" />;
      case "workshops":
        return <MonitorPlay className="w-4 h-4 text-[#666666]" />;
      case "projects":
        return <FolderKanban className="w-4 h-4 text-[#666666]" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col overflow-hidden relative">
      {/* Universal Chat Header */}
      <div className="h-24 border-b border-neutral-200 border-dashed flex items-center justify-between px-10 bg-transparent z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-neutral-300 border-dashed bg-transparent flex items-center justify-center text-neutral-500">
              <Hash className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <span className="font-header text-[28px] tracking-tighter text-black uppercase mt-1">
              {currentChat ? currentChat.name : "AWAITING SELECTION"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.1em] font-mono text-neutral-500">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D33E33] animate-pulse shadow-[0_0_8px_#D33E33]" />
            <span>LIVE CONNECTION</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.1em] font-mono text-neutral-500">
            <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>E2E SECURED</span>
          </div>
        </div>
      </div>

      {/* Main Split Interface Area */}
      <div className="flex-1 overflow-hidden flex relative bg-white">
        {/* Active Chat Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          <div 
            className="flex-1 overflow-y-auto p-8 pb-32"
            onWheel={(e) => e.stopPropagation()}
          >
            {!chatId ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="font-mono text-neutral-200 text-[120px] leading-none mb-6">
                  #
                </div>
                <div className="font-header text-[32px] tracking-tighter text-black uppercase mb-2">
                  NO CHANNEL SELECTED
                </div>
                <div className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono mt-2">
                  USE /JOIN [N] OR SELECT A CHANNEL.
                </div>
              </div>
            ) : localMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                <div className="w-24 h-24 rounded-full border border-neutral-200 border-dashed bg-transparent flex items-center justify-center mb-6">
                  <Shield
                    className="w-10 h-10 text-neutral-300"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="font-header text-[32px] tracking-tighter leading-none text-black uppercase mb-4">
                  SECURE COMMS ESTABLISHED
                </div>
                <div className="text-[10px] tracking-[0.15em] font-mono text-neutral-500 leading-relaxed uppercase">
                  CONNECTION TO #{currentChat?.name} IS ENCRYPTED.
                  <br />
                  WAITING FOR TRANSMISSION...
                </div>
              </div>
            ) : (
              <div className="flex flex-col w-full max-w-5xl mx-auto border-t border-l border-r border-neutral-200 border-dashed rounded-t-3xl overflow-hidden mt-6">
                {localMessages.map((msg, index) => {
                  const isMe = msg.sender === "me";
                  const time = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full border-b border-neutral-200 border-dashed transition-colors ${index % 2 === 0 ? "bg-neutral-50" : "bg-transparent"}`}
                    >
                      <div className="flex w-full">
                        {/* Metadata Column */}
                        <div className="w-[120px] md:w-[160px] shrink-0 border-r border-neutral-200 border-dashed p-4 md:p-6 flex flex-col justify-between">
                          <span className="text-[10px] tracking-[0.1em] font-mono text-neutral-500">
                            {time}
                          </span>
                          <span
                            className={`font-mono text-[11px] tracking-wider uppercase ${isMe ? "text-black" : "text-neutral-500"}`}
                          >
                            {isMe ? "YOU" : "SYSTEM"}
                          </span>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 p-4 md:p-6">
                          <p className="font-mono text-[14px] leading-relaxed text-neutral-600 break-words whitespace-pre-wrap">
                            {isMe ? `> ${msg.text}` : `[REC] ${msg.text}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Sliding Contextual Panel Overlay */}
        <AnimatePresence>
          {activePanel !== "none" && (
            <>
              {/* Backdrop for mobile */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActivePanel("none")}
                className="lg:hidden fixed inset-0 bg-black/80 z-20"
              />

              {/* Sliding Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0, ease: "linear" }}
                className="absolute right-0 top-0 bottom-0 w-full md:w-[600px] lg:w-[700px] xl:w-[800px] bg-white border-l border-neutral-200 border-dashed z-30 flex flex-col shadow-2xl"
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 border-dashed bg-neutral-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-neutral-300 border-dashed flex items-center justify-center bg-transparent">
                      {getPanelIcon()}
                    </div>
                    <span className="font-header text-[22px] tracking-tighter text-black uppercase mt-1">
                      /{activePanel}
                    </span>
                  </div>
                  <button
                    onClick={() => setActivePanel("none")}
                    className="w-10 h-10 rounded-full border border-transparent hover:border-neutral-200 border-dashed text-neutral-500 hover:text-black transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Panel Content Injection */}
                <div className="flex-1 overflow-y-auto bg-white">
                  {renderFloatingPanel()}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Bottom Input Area */}
      <div className="p-8 bg-white border-t border-neutral-200 border-dashed shrink-0">
        <div className="max-w-5xl mx-auto w-full flex items-end gap-4 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              chatId
                ? "INPUT TRANSMISSION... (USE '/' FOR COMMANDS)"
                : "AWAITING CHANNEL SELECTION..."
            }
            disabled={!chatId || sending}
            rows={1}
            className="w-full bg-transparent border border-neutral-300 border-dashed focus:border-black/30 outline-none font-mono text-[14px] leading-relaxed text-black placeholder:text-neutral-400 resize-none py-4 pl-12 pr-20 rounded-3xl custom-scrollbar transition-colors min-h-[54px]"
            style={{
              height: message
                ? `${Math.min(120, message.split("\n").length * 24 + 16)}px`
                : "54px",
            }}
          />
          <div className="absolute left-5 bottom-[17px] pointer-events-none">
            <span className="font-mono text-neutral-400 animate-pulse">
              &gt;
            </span>
          </div>
          <div className="absolute right-2 bottom-2">
            <button
              onClick={handleSend}
              disabled={!message.trim() || !chatId || sending}
              className="w-10 h-10 rounded-full border border-neutral-300 border-dashed bg-transparent text-neutral-500 hover:text-black hover:border-black/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Send className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
