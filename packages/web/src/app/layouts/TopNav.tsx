import * as React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../shared/lib/utils";
import { useAppSelector } from "../../store/hooks";
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  GitPullRequest,
  FileText,
  MonitorPlay,
  Settings,
  Search,
  Zap,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════════
   Floating Capsule Navigation — Three separate pill groups
   Logo | Nav Tabs (liquid glass indicator) | Search + Profile
   ═══════════════════════════════════════════════════════════════════════════ */

interface TopNavProps {
  onCommandPaletteOpen: () => void;
  onNotificationsOpen?: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Decisions", href: "/decisions", icon: GitPullRequest },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Workshops", href: "/workshops", icon: MonitorPlay },
];

/** Liquid water droplet spring */
const LIQUID_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 28,
  mass: 0.9,
};

/** Frosted glass capsule shared styles */
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

function getActiveIndex(pathname: string): number {
  for (let i = navItems.length - 1; i >= 0; i--) {
    const item = navItems[i];
    if (item.href === "/") {
      if (pathname === "/") return i;
    } else if (pathname.startsWith(item.href)) {
      return i;
    }
  }
  return 0;
}

export function TopNav({
  onCommandPaletteOpen,
  onNotificationsOpen,
}: TopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Direction tracking for wobble
  const currentIndex = getActiveIndex(location.pathname);
  const prevIndexRef = React.useRef(currentIndex);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  React.useEffect(() => {
    const prev = prevIndexRef.current;
    if (currentIndex !== prev) {
      setDirection(currentIndex > prev ? 1 : -1);
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.header
      className="w-full px-6 flex items-center justify-between z-40 pointer-events-none"
      style={{ paddingTop: 16, paddingBottom: 16 }}
    >
      {/* ── CAPSULE 1: Logo ───────────────────────────────────── */}
      <motion.div
        className="pointer-events-auto flex items-center gap-3 px-5 rounded-full cursor-pointer select-none h-[52px]"
        style={CAPSULE_STYLE}
        onClick={() => navigate("/")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-white fill-white" strokeWidth={2} />
        </div>
        <span className="font-header text-[22px] tracking-[0.18em] leading-none text-black mt-0.5">
          SENTRY
        </span>
      </motion.div>

      {/* ── CAPSULE 2: Nav Tabs ───────────────────────────────── */}
      <motion.nav
        className="pointer-events-auto hidden md:flex items-center gap-0.5 px-2 rounded-full h-[52px]"
        style={CAPSULE_STYLE}
      >
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "relative flex items-center px-4 h-8 text-[11px] tracking-[0.14em] uppercase font-mono transition-colors duration-150 rounded-full outline-none select-none z-0",
                isActive
                  ? "text-black font-semibold"
                  : "text-neutral-500 hover:text-black",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-liquid-glass"
                  className="absolute inset-0 rounded-full z-[-1]"
                  transition={LIQUID_SPRING}
                  animate={{
                    scaleX: [0.78, 1.06, 0.97, 1],
                    scaleY: [1.14, 0.95, 1.02, 1],
                  }}
                  style={{
                    /* Pull transform origin to trailing edge so squish goes in travel direction */
                    transformOrigin:
                      direction > 0 ? "left center" : "right center",
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
                  }}
                />
              )}
              {item.name}
            </NavLink>
          );
        })}
      </motion.nav>

      {/* ── CAPSULE 3: Search + Bell + User ──────────────────── */}
      <motion.div
        className="pointer-events-auto flex items-center gap-1 px-2 rounded-full h-[52px]"
        style={CAPSULE_STYLE}
      >
        {/* Search */}
        <button
          onClick={onCommandPaletteOpen}
          className="flex items-center gap-2 px-4 h-8 rounded-full text-neutral-500 hover:text-black hover:bg-black/5 transition-all outline-none group"
        >
          <Search className="w-4 h-4" />
          <span className="hidden xl:inline text-[10px] tracking-[0.1em] uppercase font-mono">
            Search
          </span>
          <kbd className="hidden xl:inline-flex items-center bg-black/8 text-neutral-500 font-mono text-[9px] px-1.5 py-0.5 rounded-md">
            ⌘K
          </kbd>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-200 mx-1" />

        {/* Bell */}
        {onNotificationsOpen && (
          <button
            onClick={onNotificationsOpen}
            className="relative h-8 w-8 flex items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-black/5 transition-all outline-none"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#D33E33] rounded-full shadow-[0_0_6px_#D33E33]" />
          </button>
        )}

        {/* User chip */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 h-8 rounded-full text-black hover:bg-black/5 transition-all outline-none"
          >
            {/* Avatar circle */}
            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center shrink-0">
              <span className="text-white font-mono text-[9px] font-bold uppercase">
                {(user?.handle || user?.displayName || "U").slice(0, 2)}
              </span>
            </div>
            <span className="hidden lg:inline text-[11px] font-mono uppercase tracking-wider text-neutral-700">
              {user?.handle || "OPR"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-[calc(100%+8px)] w-60 flex flex-col z-50 p-2 rounded-3xl"
                style={CAPSULE_STYLE}
              >
                <div className="px-4 py-4 border-b border-neutral-100 mb-2 text-center">
                  <p className="font-header text-black text-[24px] tracking-widest leading-none mb-1">
                    {user?.displayName || "Operator"}
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.15em] text-neutral-400 uppercase">
                    @{user?.handle || "user"}
                  </p>
                </div>
                <NavLink
                  to="/profile"
                  className="flex items-center gap-3 font-mono px-4 py-2.5 text-neutral-500 hover:text-black hover:bg-black/5 transition-colors rounded-full mb-0.5"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span className="text-[10px] tracking-[0.1em] uppercase">
                    Profile
                  </span>
                </NavLink>
                <NavLink
                  to="/settings"
                  className="flex items-center gap-3 font-mono px-4 py-2.5 text-neutral-500 hover:text-black hover:bg-black/5 transition-colors rounded-full mb-0.5"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-[10px] tracking-[0.1em] uppercase">
                    Settings
                  </span>
                </NavLink>
                <div className="border-t border-neutral-100 mt-1 pt-1">
                  <button
                    className="w-full flex items-center gap-3 font-mono px-4 py-2.5 text-[#D33E33]/70 hover:text-[#D33E33] hover:bg-[#D33E33]/8 transition-colors rounded-full"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className="text-[10px] tracking-[0.1em] uppercase">
                      Sign Out
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.header>
  );
}

/* ── Mobile Navigation ───────────────────────────────────────────────── */
export function MobileNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-stretch rounded-full md:hidden z-50 px-2 py-1.5 gap-0.5"
      style={CAPSULE_STYLE}
    >
      {navItems.slice(0, 5).map((item) => {
        const isActive =
          location.pathname === item.href ||
          (item.href !== "/" && location.pathname.startsWith(item.href));
        const IconComponent = item.icon;

        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-full",
              "transition-colors font-mono text-[8px] tracking-[0.12em] uppercase outline-none",
              isActive ? "text-black" : "text-neutral-400 hover:text-black",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="mobile-nav-pill"
                className="absolute inset-0 rounded-full z-0"
                transition={LIQUID_SPRING}
                style={{ background: "rgba(0,0,0,0.08)" }}
              />
            )}
            <IconComponent className="w-5 h-5 relative z-10" />
            <span className="relative z-10">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
