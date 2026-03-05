import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import {
  useGetChatsQuery,
  useGetProjectsQuery,
  useGetDecisionsQuery,
  useGetWorkshopsQuery,
  useGetDocumentsQuery,
} from "../../shared/api/apiSlice";
import { formatDistanceToNow } from "date-fns";
import { Terminal, Shield, Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   COMMAND CENTER - TERMINAL DASHBOARD
   Full CLI-style experience matching Login/Register aesthetic
   ═══════════════════════════════════════════════════════════════════════════ */

interface LogEntry {
  id: string;
  text: string;
  type: "info" | "success" | "error" | "warning" | "header" | "divider";
}

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isBooting, setIsBooting] = useState(true);

  // Fetch real data from API
  const { data: projectsData = [] } = useGetProjectsQuery();
  const { data: chatsData = [] } = useGetChatsQuery();
  // These require a projectId - skip for now in dashboard
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const { data: decisionsData = [] } = useGetDecisionsQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });
  const { data: workshopsData = [] } = useGetWorkshopsQuery(
    { projectId: selectedProjectId },
    { skip: !selectedProjectId },
  );
  const { data: documentsData = [] } = useGetDocumentsQuery(
    { projectId: selectedProjectId },
    { skip: !selectedProjectId },
  );

  // Stats from real data (with fallbacks)
  const projectCount = projectsData.length || 0;
  const chatCount = chatsData.length || 0;
  const decisionCount = decisionsData.length || 0;
  const workshopCount = workshopsData.length || 0;
  const docCount = documentsData.length || 0;

  // Track if boot has run
  const hasBooted = useRef(false);

  // Boot sequence animation - runs only once
  useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;

    const bootSequence: LogEntry[] = [
      { id: "1", text: "SENTRY_OS v4.0.2 [COMMAND CENTER]", type: "header" },
      {
        id: "2",
        text: "═══════════════════════════════════════════════════════",
        type: "divider",
      },
      { id: "3", text: "INIT: LOADING COMMAND CENTER...", type: "info" },
      { id: "4", text: "SYNC: CONNECTING TO NEURAL MESH...", type: "info" },
      { id: "5", text: "✓ SECURE UPLINK ESTABLISHED", type: "success" },
      {
        id: "6",
        text: `✓ OPERATOR: @${user?.handle || user?.displayName || "COMMANDER"}`,
        type: "success",
      },
      { id: "7", text: "", type: "info" },
      {
        id: "8",
        text: "── SYSTEM STATUS ──────────────────────────────────────",
        type: "divider",
      },
      { id: "9", text: `  ACTIVE_PROJECTS:  ${projectCount}`, type: "info" },
      { id: "10", text: `  OPEN_CHANNELS:    ${chatCount}`, type: "info" },
      {
        id: "11",
        text: `  DECISIONS:        ${decisionCount}`,
        type: decisionCount > 0 ? "warning" : "info",
      },
      { id: "12", text: `  WORKSHOPS:        ${workshopCount}`, type: "info" },
      { id: "13", text: `  DOCUMENTS:        ${docCount}`, type: "info" },
      { id: "14", text: "", type: "info" },
      {
        id: "15",
        text: "═══════════════════════════════════════════════════════",
        type: "divider",
      },
      { id: "16", text: "SYSTEM READY. AWAITING COMMAND.", type: "success" },
      { id: "17", text: "", type: "info" },
    ];

    // Staggered boot animation using recursive setTimeout
    let currentIndex = 0;

    const addNextLog = () => {
      if (currentIndex < bootSequence.length) {
        setLogs((prev) => [...prev, bootSequence[currentIndex]]);
        currentIndex++;
        setTimeout(addNextLog, 50);
      } else {
        setIsBooting(false);
        inputRef.current?.focus();
      }
    };

    addNextLog();
  }, []); // Empty deps - run once

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Handle commands
  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || !command.trim()) return;

    const cmd = command.toLowerCase().trim();
    setLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), text: `cmd> ${command}`, type: "info" },
    ]);
    setCommand("");

    // Command routing
    if (cmd === "help" || cmd === "?") {
      addLogs([
        { text: "", type: "info" },
        {
          text: "── AVAILABLE COMMANDS ─────────────────────────────────",
          type: "divider",
        },
        { text: "  chat      → Open communications hub", type: "info" },
        { text: "  projects  → View active projects", type: "info" },
        { text: "  decisions → Review pending decisions", type: "info" },
        { text: "  docs      → Access document vault", type: "info" },
        { text: "  workshop  → Enter workshop space", type: "info" },
        { text: "  profile   → View operator dossier", type: "info" },
        { text: "  status    → System status report", type: "info" },
        { text: "  clear     → Clear terminal", type: "info" },
        { text: "  logout    → Terminate session", type: "info" },
        { text: "", type: "info" },
      ]);
    } else if (cmd === "chat" || cmd === "comms") {
      addLogs([
        { text: "→ ROUTING TO COMMUNICATIONS HUB...", type: "success" },
      ]);
      setTimeout(() => navigate("/chat"), 500);
    } else if (cmd === "projects" || cmd === "proj") {
      addLogs([{ text: "→ LOADING PROJECT MATRIX...", type: "success" }]);
      setTimeout(() => navigate("/projects"), 500);
    } else if (cmd === "decisions" || cmd === "decide") {
      addLogs([{ text: "→ ACCESSING DECISION LOG...", type: "success" }]);
      setTimeout(() => navigate("/decisions"), 500);
    } else if (cmd === "docs" || cmd === "documents") {
      addLogs([{ text: "→ OPENING DOCUMENT VAULT...", type: "success" }]);
      setTimeout(() => navigate("/documents"), 500);
    } else if (cmd === "workshop" || cmd === "ws") {
      addLogs([{ text: "→ ENTERING WORKSHOP SPACE...", type: "success" }]);
      setTimeout(() => navigate("/workshops"), 500);
    } else if (cmd === "profile" || cmd === "me") {
      addLogs([{ text: "→ LOADING OPERATOR DOSSIER...", type: "success" }]);
      setTimeout(() => navigate("/profile"), 500);
    } else if (cmd === "status") {
      addLogs([
        { text: "", type: "info" },
        {
          text: "── SYSTEM STATUS ──────────────────────────────────────",
          type: "divider",
        },
        { text: "  UPTIME:           99.7%", type: "success" },
        { text: "  LATENCY:          12ms", type: "success" },
        { text: "  ACTIVE SESSIONS:  47", type: "info" },
        { text: "  MEMORY:           2.4GB / 8GB", type: "info" },
        { text: "  STATUS:           OPERATIONAL", type: "success" },
        { text: "", type: "info" },
      ]);
    } else if (cmd === "clear" || cmd === "cls") {
      setLogs([
        { id: "1", text: "SENTRY_OS v4.0.2 [COMMAND CENTER]", type: "header" },
        {
          id: "2",
          text: "═══════════════════════════════════════════════════════",
          type: "divider",
        },
        {
          id: "3",
          text: "TERMINAL CLEARED. AWAITING COMMAND.",
          type: "success",
        },
        { id: "4", text: "", type: "info" },
      ]);
    } else if (cmd === "logout" || cmd === "exit") {
      addLogs([
        { text: "TERMINATING SESSION...", type: "warning" },
        { text: "GOODBYE, COMMANDER.", type: "info" },
      ]);
      setTimeout(() => {
        dispatch(logout());
        navigate("/login");
      }, 1000);
    } else {
      addLogs([
        { text: `ERR: UNKNOWN COMMAND "${cmd}"`, type: "error" },
        { text: 'TYPE "help" FOR AVAILABLE COMMANDS', type: "info" },
      ]);
    }
  };

  const addLogs = (entries: Omit<LogEntry, "id">[]) => {
    const newLogs = entries.map((e, i) => ({
      ...e,
      id: `${Date.now()}-${i}`,
    }));
    setLogs((prev) => [...prev, ...newLogs]);
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-success";
      case "error":
        return "text-error";
      case "warning":
        return "text-warning";
      case "header":
        return "text-success font-bold";
      case "divider":
        return "text-terminal-600";
      default:
        return "text-terminal-400";
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
          <span className="text-xs uppercase tracking-wider">
            Command Center
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-terminal-600 text-xs">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>ONLINE</span>
          </div>
          <div className="flex items-center gap-2 text-terminal-600 text-xs">
            <Shield className="w-3 h-3" />
            <span>SECURE</span>
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Logs */}
          <div className="space-y-0.5">
            {logs.filter(Boolean).map((log, index) => (
              <motion.div
                key={`${log.id}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.05 }}
                className={getLogColor(log.type)}
              >
                {log.text || "\u00A0"}
              </motion.div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Command Input */}
          {!isBooting && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-terminal-500">cmd&gt;</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleCommand}
                  className="bg-transparent border-none outline-none w-full text-terminal-100"
                  placeholder=""
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                {/* Blinking Cursor */}
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                  className="absolute top-0 h-5 w-2 bg-success pointer-events-none"
                  style={{ left: `${command.length * 9.6}px` }}
                />
              </div>
            </div>
          )}

          {/* Booting indicator */}
          {isBooting && (
            <div className="mt-4 flex items-center gap-2 text-success animate-pulse">
              <Loader2 className="animate-spin w-4 h-4" />
              <span>INITIALIZING...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-terminal-800 text-center text-terminal-600 text-[10px]">
        SENTRY COLLABORATIVE OS • TYPE "help" FOR COMMANDS
      </div>
    </div>
  );
}
