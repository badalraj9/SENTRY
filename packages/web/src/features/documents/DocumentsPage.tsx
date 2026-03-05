import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  MoreHorizontal,
  FileText,
  Clock,
  User,
  Terminal,
  Shield,
  Loader2,
} from "lucide-react";
import { DocEditor } from "../editor";
// import { cn } from '../../shared/lib/utils';
import { Button, EmptyState } from "../../shared/ui";
import {
  useGetDocumentsQuery,
  useGetProjectsQuery,
} from "../../shared/api/apiSlice";

/* ═══════════════════════════════════════════════════════════════════════════
   Documents Page
   Document list + editor view
   ═══════════════════════════════════════════════════════════════════════════ */

interface LogEntry {
  id: string;
  text: string;
  type: "info" | "success" | "error" | "warning" | "header" | "divider";
}

const SAMPLE_CONTENT = `
<h1>Technical Architecture Overview</h1>
<p>This document outlines the core architectural decisions for our platform.</p>

<h2>System Design</h2>
<p>Our system follows a <strong>modular, feature-sliced architecture</strong> that promotes scalability and maintainability.</p>

<p>Key principles:</p>
<ul>
<li>Component isolation and reusability</li>
<li>Clear separation of concerns</li>
<li>Type-safe data flow</li>
<li>Real-time synchronization</li>
</ul>

<h2>Embedded Decisions</h2>
<p>Below is an embedded decision card that was approved by the team:</p>

<decision-embed id="104" title="Migrate to Rust Bundler" status="approved"></decision-embed>

<p>This decision impacts our build pipeline significantly.</p>

<h2>Next Steps</h2>
<blockquote>
<p>We need to finalize the API contract before proceeding with implementation.</p>
</blockquote>

<p>The following tasks are blocked on this architecture review:</p>
<ol>
<li>Backend service implementation</li>
<li>Frontend component library</li>
<li>Integration testing suite</li>
</ol>
`;

export function DocumentsPage() {
  const { docId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const logsEndRef = React.useRef<HTMLDivElement>(null);

  const [command, setCommand] = React.useState("");
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isBooting, setIsBooting] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Real Data Fetch
  const { data: projects = [] } = useGetProjectsQuery();
  const activeProjectId = projects[0]?.id || "mock-id";
  const { data: documents = [], isLoading } = useGetDocumentsQuery(
    { projectId: activeProjectId },
    { skip: !activeProjectId },
  );

  // Mock Fallback if API fails or empty
  const MOCK_DOCUMENTS = [
    {
      id: "1",
      title: "Project Overview",
      updatedAt: "2026-01-15T10:30:00Z",
      createdBy: "Alex",
    },
    {
      id: "2",
      title: "Technical Architecture",
      updatedAt: "2026-01-14T15:45:00Z",
      createdBy: "Jordan",
    },
    {
      id: "3",
      title: "API Documentation",
      updatedAt: "2026-01-13T09:20:00Z",
      createdBy: "Sam",
    },
    {
      id: "4",
      title: "User Research Notes",
      updatedAt: "2026-01-12T14:00:00Z",
      createdBy: "Taylor",
    },
  ];

  const displayDocs =
    documents.length > 0
      ? documents.map((d) => ({
          id: d.id,
          title: d.title,
          updatedAt: d.updatedAt,
          createdBy: "You", // Simplified
        }))
      : MOCK_DOCUMENTS;

  const [content, setContent] = React.useState(SAMPLE_CONTENT);
  const [isSaving, setIsSaving] = React.useState(false);

  const selectedDoc = docId ? displayDocs.find((d) => d.id === docId) : null;

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
    console.log("Document saved:", content);
  };

  // Track if boot has run
  const hasBooted = React.useRef(false);

  // Boot sequence animation
  React.useEffect(() => {
    if (hasBooted.current || docId) return;
    hasBooted.current = true;

    const filteredCount = searchQuery
      ? displayDocs.filter((d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()),
        ).length
      : displayDocs.length;

    const bootSequence: LogEntry[] = [
      { id: "1", text: "SENTRY_OS v4.0.2 [DOCUMENT VAULT]", type: "header" },
      {
        id: "2",
        text: "═══════════════════════════════════════════════════════",
        type: "divider",
      },
      { id: "3", text: "INIT: MOUNTING DOCUMENT REPOSITORY...", type: "info" },
      {
        id: "4",
        text: `✓ LOADED ${displayDocs.length} DOCUMENTS`,
        type: "success",
      },
      { id: "5", text: "✓ INDEX GENERATED", type: "success" },
      { id: "6", text: "", type: "info" },
      {
        id: "7",
        text: "── DOCUMENT INDEX ────────────────────────────────────",
        type: "divider",
      },
      ...(displayDocs.length > 0
        ? displayDocs.map((doc, i) => ({
            id: `${8 + i}`,
            text: `  [${i + 1}] ${doc.title}`,
            type: "info" as const,
          }))
        : [
            {
              id: "empty-doc",
              text: "  [EMPTY STATE RENDERED]",
              type: "info" as const,
            },
          ]),
      { id: `${8 + displayDocs.length}`, text: "", type: "info" },
      {
        id: `${9 + displayDocs.length}`,
        text: `TOTAL: ${displayDocs.length} DOCUMENTS`,
        type: "success",
      },
      { id: `${10 + displayDocs.length}`, text: "", type: "info" },
      {
        id: `${11 + displayDocs.length}`,
        text: 'TYPE "open <n>" TO EDIT OR CREATE NEW DOCUMENT',
        type: "info",
      },
      { id: `${12 + displayDocs.length}`, text: "", type: "info" },
    ];

    let currentIndex = 0;
    const addNextLog = () => {
      if (currentIndex < bootSequence.length) {
        setLogs((prev) => [...prev, bootSequence[currentIndex]]);
        currentIndex++;
        setTimeout(addNextLog, 40);
      } else {
        setIsBooting(false);
        inputRef.current?.focus();
      }
    };
    addNextLog();
  }, [displayDocs.length, docId, searchQuery]);

  // Auto-scroll
  React.useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Handle commands
  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || !command.trim()) return;

    const cmd = command.toLowerCase().trim();
    setLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), text: `doc> ${command}`, type: "info" },
    ]);
    setCommand("");

    if (cmd === "help" || cmd === "?") {
      setLogs((prev) => [
        ...prev,
        { id: Date.now() + "1", text: "", type: "info" },
        {
          id: Date.now() + "2",
          text: "── AVAILABLE COMMANDS ────────────────────────────────",
          type: "divider",
        },
        {
          id: Date.now() + "3",
          text: "  open <n>  → Open document by number",
          type: "info",
        },
        {
          id: Date.now() + "4",
          text: "  new       → Create new document",
          type: "info",
        },
        {
          id: Date.now() + "5",
          text: "  search    → Search documents",
          type: "info",
        },
        {
          id: Date.now() + "6",
          text: "  clear     → Clear terminal",
          type: "info",
        },
        { id: Date.now() + "7", text: "", type: "info" },
      ]);
    } else if (cmd.startsWith("open ") || cmd.startsWith("edit ")) {
      const num = parseInt(cmd.split(" ")[1]) - 1;
      if (!isNaN(num) && num >= 0 && num < displayDocs.length) {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + "1",
            text: `→ OPENING: ${displayDocs[num].title}...`,
            type: "success",
          },
        ]);
        setTimeout(() => navigate(`/documents/${displayDocs[num].id}`), 300);
      } else {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + "1",
            text: `ERR: INVALID DOCUMENT NUMBER`,
            type: "error",
          },
        ]);
      }
    } else if (cmd === "new") {
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + "1",
          text: "→ CREATING NEW DOCUMENT...",
          type: "success",
        },
      ]);
      setTimeout(() => navigate("/documents/new"), 300);
    } else if (cmd.startsWith("search ")) {
      const query = cmd.substring(7);
      setSearchQuery(query);
      const results = displayDocs.filter((d) =>
        d.title.toLowerCase().includes(query.toLowerCase()),
      );
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + "1",
          text: `→ SEARCHING FOR: "${query}"`,
          type: "info",
        },
        {
          id: Date.now() + "2",
          text: `FOUND ${results.length} MATCHES`,
          type: results.length > 0 ? "success" : "warning",
        },
      ]);
    } else if (cmd === "clear" || cmd === "cls") {
      setLogs([]);
    } else {
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + "1",
          text: `ERR: UNKNOWN COMMAND "${cmd}"`,
          type: "error",
        },
      ]);
    }
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

  // Document list view - Terminal interface
  if (!docId) {
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
              Document Vault
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-terminal-600 text-xs">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>INDEXED</span>
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
              {logs.filter(Boolean).map((log) => {
                if (log.text === "  [EMPTY STATE RENDERED]") return null;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.05 }}
                    className={getLogColor(log.type)}
                  >
                    {log.text || "\u00A0"}
                  </motion.div>
                );
              })}

              {displayDocs.length === 0 && !isBooting && (
                <div className="my-8">
                  <EmptyState
                    icon={FileText}
                    title="Vault is Empty"
                    description="No technical documents have been archived in this project yet. Initialize the first schema or design doc."
                    actionLabel="New Document"
                    onAction={() => navigate("/documents/new")}
                  />
                </div>
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Command Input */}
            {!isBooting && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-terminal-500">doc&gt;</span>
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={handleCommand}
                    className="bg-transparent border-none outline-none w-full text-terminal-100"
                    placeholder="Type 'help' for commands..."
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                  />
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
                <span>INDEXING DOCUMENTS...</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-terminal-800 text-center text-terminal-600 text-[10px]">
          SENTRY DOCUMENT VAULT • TYPE "help" FOR COMMANDS
        </div>
      </div>
    );
  }

  // Editor view
  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-terminal-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/documents")}
            className="p-1.5 rounded hover:bg-terminal-800 text-terminal-500 hover:text-terminal-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-medium text-terminal-200">
              {selectedDoc?.title || "New Document"}
            </h1>
            <p className="text-xs text-terminal-500 font-mono">
              {selectedDoc
                ? `Updated ${new Date(selectedDoc.updatedAt).toLocaleDateString()}`
                : "Unsaved"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={14} className="mr-1.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <button className="p-2 rounded hover:bg-terminal-800 text-terminal-500 hover:text-terminal-300 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-12 px-8">
          <DocEditor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}

export default DocumentsPage;
