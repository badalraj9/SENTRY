import * as React from "react";
import { NavLink, useParams, useNavigate, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Hash, 
  Lock, 
  Volume2, 
  Plus, 
  Users, 
  MessageSquarePlus, 
  UserPlus,
  Zap,
  Activity,
  ChevronRight
} from "lucide-react";
import { cn } from "../../shared/lib/utils";
import { useAppSelector } from "../../store/hooks";

/* ═══════════════════════════════════════════════════════════════════════════
   COMMS HUB (PRECISION LIQUID NAVIGATION)
   Locked against horizontal overflow. Perfectly stable rail.
   ═══════════════════════════════════════════════════════════════════════════ */

const LIQUID_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 28,
  mass: 0.9,
};

const CAPSULE_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.85)",
  boxShadow: [
    "0 4px 24px rgba(0,0,0,0.07)",
    "0 1px 2px rgba(0,0,0,0.04)",
    "inset 0 1px 1px rgba(255,255,255,1)",
  ].join(", "),
};

const LIQUID_PILL_STYLE: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.92)",
  backdropFilter: "blur(12px) saturate(180%)",
  WebkitBackdropFilter: "blur(12px) saturate(180%)",
  border: "1px solid rgba(255,255,255,1)",
  boxShadow: [
    "0 2px 12px rgba(0,0,0,0.10)",
    "0 1px 3px rgba(0,0,0,0.06)",
    "inset 0 1.5px 2px rgba(255,255,255,1)",
    "inset 0 -1px 1.5px rgba(0,0,0,0.04)",
  ].join(", "),
};

export default function ChannelsPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const demoChats = React.useMemo(() => [
    { id: "sentry-system", name: "SENTRY // SYSTEM", latestMessage: "Node active. Clearance Level 5 verified.", unreadCount: 1, isSystem: true, status: "online", type: "SYSTEM" },
    { id: "general", name: "general", latestMessage: "Welcome to the central node.", unreadCount: 0, status: "online", type: "PUBLIC", members: 256 },
    { id: "frontend", name: "frontend-dev", latestMessage: "Assets pushed to the spatial grid.", unreadCount: 2, status: "online", type: "PUBLIC", members: 24 },
    { id: "ops", name: "devops", latestMessage: "Database migration scheduled for 0400 UTC.", unreadCount: 0, status: "online", type: "PRIVATE", members: 8 },
    { id: "alex-chen", name: "Alex Chen", latestMessage: "The neural bridge is holding steady at 98%.", unreadCount: 0, status: "online", type: "DM" },
    { id: "jordan-lee", name: "Jordan Lee", latestMessage: "I'll check the logs now.", unreadCount: 5, status: "away", type: "DM" },
  ], []);

  const currentIndex = demoChats.findIndex(c => location.pathname.includes(c.id));
  const prevIndexRef = React.useRef(currentIndex);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  React.useEffect(() => {
    const prev = prevIndexRef.current;
    if (currentIndex !== -1 && currentIndex !== prev) {
      setDirection(currentIndex > prev ? 1 : -1);
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  return (
    <div className="h-full w-full bg-transparent overflow-hidden flex p-4 gap-6 relative">
      {/* ── LEFT RAIL ── */}
      <div className="w-[420px] flex flex-col shrink-0 h-full overflow-hidden">
        <div className="mb-6 px-4 shrink-0">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer" onClick={() => navigate("/")}>
              <Zap className="w-6 h-6 text-white fill-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-header text-[28px] tracking-tighter text-black uppercase leading-none mt-1">
                COMMS HUB
              </h1>
              <p className="text-[10px] tracking-[0.2em] font-mono text-neutral-400 uppercase mt-2">SECURE_NODE // ACTIVE</p>
            </div>
          </div>

          <div className="flex gap-3">
            <RetroOvalButton icon={UserPlus} label="ADD" onClick={() => {}} compact />
            <RetroOvalButton icon={MessageSquarePlus} label="CREATE GROUP" onClick={() => {}} variant="primary" compact />
          </div>
        </div>

        {/* 
           STABLE RAIL: overflow-x-hidden is CRITICAL here. 
           It kills the horizontal slider caused by the liquid wobble bulge.
        */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none flex flex-col gap-1.5 p-2 rounded-[40px] pointer-events-auto"
          style={CAPSULE_STYLE}
          onWheel={(e) => e.stopPropagation()}
        >
          {demoChats.map((chat) => {
            const isActive = location.pathname.includes(chat.id);
            const Icon = chat.isSystem ? Zap : (chat.type === 'BROADCAST' ? Volume2 : chat.type === 'PRIVATE' ? Lock : (chat.type === 'PUBLIC' ? Hash : null));

            return (
              <NavLink
                key={chat.id}
                to={`/messages/${chat.id}`}
                className={cn(
                  "relative flex items-center gap-4 px-4 h-[72px] rounded-[24px] mx-0.5 transition-colors duration-150 outline-none select-none z-0 group",
                  isActive ? "text-black font-semibold" : "text-neutral-500 hover:text-black",
                )}
              >
                {/* LIQUID PILL - Wobble stays inside the rail now */}
                {isActive && (
                  <motion.span
                    layoutId="list-liquid-glass"
                    className="absolute inset-0 rounded-[24px] z-[-1] transform-gpu will-change-transform"
                    transition={LIQUID_SPRING}
                    animate={{
                      scaleY: [0.78, 1.06, 0.97, 1],
                      scaleX: [1.14, 0.95, 1.02, 1],
                    }}
                    style={{
                      transformOrigin: direction > 0 ? "top center" : "bottom center",
                      ...LIQUID_PILL_STYLE
                    }}
                  />
                )}

                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border relative transition-all duration-300 shadow-sm", chat.isSystem ? "bg-black text-white" : isActive ? "bg-white text-black border-neutral-200" : "bg-neutral-50 border-neutral-100")}>
                  {Icon ? <Icon size={18} className={chat.isSystem ? "fill-white" : ""} /> : <span className="text-[11px] font-bold font-mono">{chat.name[0]}</span>}
                  <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-white", chat.status === "online" ? "bg-emerald-500" : chat.status === "away" ? "bg-amber-400" : "bg-neutral-300")} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={cn("text-[14px] font-header tracking-tight uppercase truncate leading-none mt-0.5 flex items-center gap-2", isActive ? "text-black" : "text-neutral-500")}>
                      {chat.name}
                      {chat.members && <span className="text-[9px] font-mono tracking-widest text-neutral-400 flex items-center gap-1"><Users size={8} />{chat.members}</span>}
                    </h3>
                    {chat.unreadCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded-full">{chat.unreadCount}</span>}
                  </div>
                  <p className="text-[11px] font-mono truncate tracking-wide text-neutral-400">{chat.latestMessage}</p>
                </div>
                
                {/* Quick Add Member button on hover */}
                {chat.type !== 'SYSTEM' && chat.type !== 'DM' && (
                  <button className="w-8 h-8 rounded-full border border-neutral-200 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black hover:text-white hover:border-black shrink-0 shadow-sm absolute right-12 z-10" title="Add Member">
                    <Plus size={14} />
                  </button>
                )}

                <ChevronRight className={cn("w-4 h-4 transition-all duration-300 shrink-0", isActive ? "opacity-100 translate-x-0" : "opacity-0 group-hover:opacity-30 -translate-x-2 group-hover:translate-x-0")} />
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT AREA ── */}
      <div className="flex-1 h-full min-w-0 z-10 relative">
        <div className="h-full w-full">
          {channelId ? (
            <Outlet />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 rounded-[36px] bg-white border border-neutral-100 flex items-center justify-center mb-10 shadow-sm">
                 <Activity size={40} className="text-neutral-200 opacity-20" />
              </div>
              <h2 className="font-header text-4xl text-black uppercase tracking-tighter mb-4 opacity-10 select-none">NODE_STANDBY</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RetroOvalButton({ icon: Icon, label, onClick, variant = 'secondary', compact = false }: { icon: any; label: string; onClick: () => void; variant?: 'primary' | 'secondary'; compact?: boolean; }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn("rounded-full flex items-center gap-3 transition-all duration-300 shadow-sm border h-[48px]", compact ? "px-6" : "px-10", variant === 'primary' ? "bg-black text-white border-black shadow-black/10" : "bg-white text-black border-neutral-200 backdrop-blur-md")}>
      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", variant === 'primary' ? "bg-white/10" : "bg-black/5")}><Icon size={16} /></div>
      <span className="text-[10px] font-header tracking-[0.2em] uppercase mt-0.5 whitespace-nowrap">{label}</span>
    </motion.button>
  );
}
