import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "./TopNav";
import { CommandPalette } from "./CommandPalette";
import { AssistantDrawer } from "../../features/assistant/ui/AssistantDrawer";
import { ChevronDown, Zap } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Dashboard Layout
   Dynamic auto-hide navbar with content expansion logic.
   ═══════════════════════════════════════════════════════════════════════════ */

const GLASS_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.88)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,1)",
};

const NAV_SPRING = {
  type: "spring" as const,
  stiffness: 280,
  damping: 32,
  mass: 0.9,
};

const CONTENT_SPRING = {
  type: "spring" as const,
  stiffness: 280,
  damping: 32,
  mass: 1.0,
};

export function DashboardLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [assistantOpen, setAssistantOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [navVisible, setNavVisible] = React.useState(true);
  const wheelAccumRef = React.useRef(0);
  const location = useLocation();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "k") {
          e.preventDefault();
          setCommandPaletteOpen(true);
        } else if (e.key === "j") {
          e.preventDefault();
          setAssistantOpen(true);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ── Wheel-based scroll detection for Auto-Hide ── */
  const handleWheel = React.useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      wheelAccumRef.current += e.deltaY;

      if (wheelAccumRef.current > 60 && navVisible) {
        setNavVisible(false);
        wheelAccumRef.current = 0;
      } else if (wheelAccumRef.current < -40 && !navVisible) {
        setNavVisible(true);
        wheelAccumRef.current = 0;
      }

      if (Math.abs(wheelAccumRef.current) > 300) {
        wheelAccumRef.current = 0;
      }
    },
    [navVisible]
  );

  const showNav = () => {
    setNavVisible(true);
    wheelAccumRef.current = 0;
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        background: "linear-gradient(160deg, #d8d8e2 0%, #e8e8ef 30%, #ebebf2 55%, #dcdce6 100%)",
      }}
      onWheel={handleWheel}
    >
      {/* ── Floating Navbar ── Slides up out of view ── */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-40"
        animate={{
          y: navVisible ? 0 : -110,
          opacity: navVisible ? 1 : 0,
          pointerEvents: navVisible ? "auto" : "none",
        }}
        transition={NAV_SPRING}
      >
        <TopNav
          onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
          onNotificationsOpen={() => setNotificationsOpen(true)}
        />
      </motion.div>

      {/* ── Peek Tab ── Restore button when nav is hidden ── */}
      <AnimatePresence>
        {!navVisible && (
          <motion.button
            className="fixed left-1/2 top-10 -translate-x-1/2 z-50 flex items-center gap-3 px-8 py-3.5 rounded-full cursor-pointer select-none overflow-hidden"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={NAV_SPRING}
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(8px) saturate(150%)",
              WebkitBackdropFilter: "blur(8px) saturate(150%)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: [
                "0 24px 48px rgba(0,0,0,0.12)",
                "0 12px 24px rgba(0,0,0,0.08)",
                "inset 0 4px 8px rgba(255,255,255,1)", // Thick top glass rim
                "inset 0 -4px 8px rgba(0,0,0,0.1)", // Thick bottom glass refraction
                "inset 4px 0 8px rgba(255,255,255,0.6)", // Left side thickness
                "inset -4px 0 8px rgba(0,0,0,0.05)", // Right side thickness
              ].join(", "),
            }}
            onClick={showNav}
            whileHover={{ scale: 1.04, y: 4 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Hard Specular Highlight (Solid Glass) */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[90%] h-1/3 rounded-full bg-gradient-to-b from-white/90 to-white/0 pointer-events-none" />

            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 relative z-10"
              style={{
                background: "rgba(0,0,0,0.03)", // Very subtle darkening for depth
                boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.2), inset -1px -1px 3px rgba(255,255,255,0.9), 1px 1px 1px rgba(255,255,255,0.5)" // Engraved circular dimple
              }}
            >
              <Zap 
                className="w-3.5 h-3.5" 
                strokeWidth={2.5} 
                style={{
                  color: "rgba(0, 0, 0, 0.5)",
                  fill: "rgba(0, 0, 0, 0.5)",
                  filter: "drop-shadow(1px 1px 0px rgba(255,255,255,0.9)) drop-shadow(-1px -1px 0px rgba(0,0,0,0.2))"
                }}
              />
            </div>
            <span 
              className="font-header text-[12px] tracking-[0.24em] uppercase leading-none mt-0.5 relative z-10 font-bold"
              style={{
                color: "rgba(0, 0, 0, 0.5)", // Dark but translucent like it's inside
                textShadow: "1px 1px 1px rgba(255,255,255,0.9), -1px -1px 1px rgba(0,0,0,0.3)" // Engraved effect
              }}
            >
              SENTRY
            </span>
            <motion.div
              className="relative z-10"
              animate={{ y: [0, 2, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── Expands padding when nav hides ── */}
      <motion.main 
        className="h-full w-full overflow-hidden flex"
        animate={{
          paddingTop: navVisible ? 88 : 16,
        }}
        transition={CONTENT_SPRING}
      >
        <div className="h-full w-full">
          <Outlet />
        </div>
      </motion.main>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      {/* AI Assistant Drawer */}
      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}
