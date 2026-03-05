import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetProjectQuery,
} from "../../shared/api/apiSlice";
import { useAppSelector } from "../../store/hooks";
import { useParams, useNavigate } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { EmptyState } from "../../shared/ui";

interface LogEntry {
  id: string;
  text: string;
  type:
    | "info"
    | "success"
    | "error"
    | "warning"
    | "header"
    | "divider"
    | "project";
}

// ... (keep LogEntry and generateKey)

let globalKeyCounter = 0;
const generateKey = () => `log-${++globalKeyCounter}-${Date.now()}`;

export default function ProjectsPage() {
  const { projectId } = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const bootStarted = useRef(false);
  const navigate = useNavigate();

  const { data: projects } = useGetProjectsQuery();
  const { data: selectedProject } = useGetProjectQuery(projectId || "", {
    skip: !projectId,
  });
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();

  // Boot sequence
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;

    const bootSequence: LogEntry[] = [
      {
        id: generateKey(),
        text: "SENTRY_OS v4.0.2 [PROJECTS MODULE]",
        type: "header",
      },
      {
        id: generateKey(),
        text: "═══════════════════════════════════════════════════════",
        type: "divider",
      },
      {
        id: generateKey(),
        text: "INIT: LOADING PROJECTS MODULE...",
        type: "info",
      },
      {
        id: generateKey(),
        text: "✓ SECURE CONNECTION ESTABLISHED",
        type: "success",
      },
      { id: generateKey(), text: "", type: "info" },
    ];

    setLogs(bootSequence);

    const timer = setTimeout(() => {
      setIsBooting(false);
      inputRef.current?.focus();
    }, 400);

    return () => clearTimeout(timer);
  }, []);
  // Show projects when loaded
  useEffect(() => {
    if (!isBooting && projects) {
      const projectLogs: LogEntry[] = [
        {
          id: generateKey(),
          text: "── ACTIVE PROJECTS ────────────────────────────────────",
          type: "divider",
        },
      ];

      if (projects.length === 0) {
        projectLogs.push({
          id: generateKey(),
          text: "  [EMPTY STATE RENDERED]",
          type: "info",
        });
      } else {
        projects.forEach((proj, idx) => {
          projectLogs.push({
            id: generateKey(),
            text: `  [${String(idx + 1).padStart(2, "0")}] ${proj.name} ${proj.visibility === "private" ? "(private)" : ""}`,
            type: "project",
          });
        });
      }

      projectLogs.push({ id: generateKey(), text: "", type: "info" });
      projectLogs.push({
        id: generateKey(),
        text: "SYSTEM READY. AWAITING COMMAND.",
        type: "success",
      });
      projectLogs.push({ id: generateKey(), text: "", type: "info" });

      setLogs((prev) => [...prev, ...projectLogs]);
    }
  }, [projects, isBooting]);

  // Auto-scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleCommand = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" || !command.trim()) return;

      const cmdText = command;
      const cmd = command.toLowerCase().trim();
      setCommand("");

      const newLogs: LogEntry[] = [
        { id: generateKey(), text: `sys> ${cmdText}`, type: "info" },
      ];

      if (cmd === "help" || cmd === "?") {
        newLogs.push(
          { id: generateKey(), text: "", type: "info" },
          {
            id: generateKey(),
            text: "── AVAILABLE COMMANDS ────────────────────────────────",
            type: "divider",
          },
          {
            id: generateKey(),
            text: "  list           → Show all projects",
            type: "info",
          },
          {
            id: generateKey(),
            text: "  new            → Create new project",
            type: "info",
          },
          {
            id: generateKey(),
            text: "  open <name>    → Open project details",
            type: "info",
          },
          {
            id: generateKey(),
            text: "  back           → Return to dashboard",
            type: "info",
          },
          {
            id: generateKey(),
            text: "  clear          → Clear terminal",
            type: "info",
          },
          { id: generateKey(), text: "", type: "info" },
        );
      } else if (cmd === "list" || cmd === "ls") {
        if (projects && projects.length > 0) {
          newLogs.push({
            id: generateKey(),
            text: "── PROJECT LIST ────────────────────────────────────────",
            type: "divider",
          });
          projects.forEach((proj, idx) => {
            newLogs.push({
              id: generateKey(),
              text: `  [${String(idx + 1).padStart(2, "0")}] ${proj.name} (${proj.visibility})`,
              type: "info",
            });
          });
          newLogs.push({ id: generateKey(), text: "", type: "info" });
        }
      } else if (cmd === "new" || cmd === "create") {
        setShowForm(true);
        newLogs.push(
          { id: generateKey(), text: "", type: "info" },
          {
            id: generateKey(),
            text: "── CREATE NEW PROJECT ────────────────────────────────",
            type: "divider",
          },
          {
            id: generateKey(),
            text: "  Opening project creation form...",
            type: "info",
          },
          { id: generateKey(), text: "", type: "info" },
        );
      } else if (cmd.startsWith("open ") || cmd.startsWith("cd ")) {
        const projectName = cmd.replace(/^(open|cd)\s+/, "");
        const project = projects?.find(
          (p) => p.name.toLowerCase() === projectName.toLowerCase(),
        );
        if (project) {
          newLogs.push({
            id: generateKey(),
            text: `→ LOADING PROJECT: ${project.name}...`,
            type: "success",
          });
          setLogs((prev) => [...prev, ...newLogs]);
          setTimeout(() => navigate(`/p/${project.id}`), 300);
          return;
        } else {
          newLogs.push({
            id: generateKey(),
            text: `ERR: PROJECT "${projectName}" NOT FOUND`,
            type: "error",
          });
        }
      } else if (cmd === "back" || cmd === "home" || cmd === "dashboard") {
        newLogs.push({
          id: generateKey(),
          text: "→ RETURNING TO COMMAND CENTER...",
          type: "success",
        });
        setLogs((prev) => [...prev, ...newLogs]);
        setTimeout(() => navigate("/"), 300);
        return;
      } else if (cmd === "clear") {
        setLogs([]);
        return;
      } else {
        newLogs.push({
          id: generateKey(),
          text: `ERR: UNKNOWN COMMAND "${cmd}"`,
          type: "error",
        });
      }

      setLogs((prev) => [...prev, ...newLogs]);
    },
    [command, projects, navigate],
  );

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const visibility = formData.get("visibility") as
      | "public"
      | "private"
      | "invite_only";

    if (!name) return;

    try {
      await createProject({ name, description, visibility }).unwrap();
      setShowForm(false);
      setLogs((prev) => [
        ...prev,
        { id: generateKey(), text: "", type: "info" },
        {
          id: generateKey(),
          text: `✓ PROJECT "${name}" CREATED SUCCESSFULLY`,
          type: "success",
        },
        { id: generateKey(), text: "", type: "info" },
      ]);
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        {
          id: generateKey(),
          text: `ERR: FAILED TO CREATE PROJECT`,
          type: "error",
        },
      ]);
    }
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-emerald-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-amber-400";
      case "header":
        return "text-emerald-400 font-bold";
      case "divider":
        return "text-terminal-600";
      case "project":
        return "text-cyan-400";
      default:
        return "text-terminal-400";
    }
  };

  // Project Detail View
  if (projectId && selectedProject) {
    return (
      <div className="h-full w-full bg-terminal-950 text-terminal-300 font-mono text-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-terminal-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-terminal-500">
            <span>▤</span>
            <span className="text-xs uppercase tracking-wider">
              PROJECT DETAIL
            </span>
          </div>
          <button
            onClick={() => navigate("/projects")}
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            ← back to projects
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="border border-terminal-800 p-4">
              <h1 className="text-lg text-emerald-400 mb-2">
                {selectedProject.name}
              </h1>
              <p className="text-terminal-500 text-xs mb-4">
                ID: {selectedProject.id} | VISIBILITY:{" "}
                {selectedProject.visibility}
              </p>
              {selectedProject.description && (
                <p className="text-terminal-300">
                  {selectedProject.description}
                </p>
              )}
            </div>

            <div className="border border-terminal-800 p-4">
              <h2 className="text-xs text-terminal-500 mb-3 uppercase tracking-wider">
                Project Actions
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    navigate(`/messages?project=${selectedProject.id}`)
                  }
                  className="px-3 py-1.5 border border-terminal-700 text-xs hover:bg-terminal-900"
                >
                  View Messages
                </button>
                <button
                  onClick={() =>
                    navigate(`/decisions?project=${selectedProject.id}`)
                  }
                  className="px-3 py-1.5 border border-terminal-700 text-xs hover:bg-terminal-900"
                >
                  View Decisions
                </button>
                <button
                  onClick={() =>
                    navigate(`/documents?project=${selectedProject.id}`)
                  }
                  className="px-3 py-1.5 border border-terminal-700 text-xs hover:bg-terminal-900"
                >
                  View Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-terminal-950 text-terminal-300 font-mono text-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-terminal-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-terminal-500">
          <span>▤</span>
          <span className="text-xs uppercase tracking-wider">
            PROJECTS MODULE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-terminal-600 text-xs">
            {projects?.length || 0} PROJECTS
          </span>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        className="flex-1 p-6 overflow-y-auto"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="max-w-4xl mx-auto">
          {/* Logs */}
          <div className="space-y-0.5">
            {logs.filter(Boolean).map((log) => {
              if (log.text === "  [EMPTY STATE RENDERED]") return null;
              return (
                <div key={log.id} className={getLogColor(log.type)}>
                  {log.text || "\u00A0"}
                </div>
              );
            })}

            {projects?.length === 0 && !isBooting && !showForm && (
              <div className="my-8">
                <EmptyState
                  icon={FolderKanban}
                  title="No Projects Found"
                  description="Initialize a new project workspace to begin tracking tasks, documents, and decisions."
                  actionLabel="Create Project"
                  onAction={() => setShowForm(true)}
                />
              </div>
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Create Project Form */}
          {showForm && (
            <div className="mt-4 border border-terminal-800 p-4 bg-terminal-900/30">
              <h3 className="text-xs text-terminal-500 mb-3 uppercase">
                New Project
              </h3>
              <form onSubmit={handleCreateProject} className="space-y-3">
                <div>
                  <label className="text-xs text-terminal-600 block mb-1">
                    NAME *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full bg-terminal-950 border border-terminal-700 px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
                    placeholder="project-name"
                  />
                </div>
                <div>
                  <label className="text-xs text-terminal-600 block mb-1">
                    DESCRIPTION
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    className="w-full bg-terminal-950 border border-terminal-700 px-3 py-1.5 text-sm focus:border-emerald-500 outline-none resize-none"
                    placeholder="Brief description..."
                  />
                </div>
                <div>
                  <label className="text-xs text-terminal-600 block mb-1">
                    VISIBILITY
                  </label>
                  <select
                    name="visibility"
                    defaultValue="private"
                    className="w-full bg-terminal-950 border border-terminal-700 px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="public">public</option>
                    <option value="private">private</option>
                    <option value="invite_only">invite_only</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-1.5 bg-emerald-600 text-terminal-950 text-xs hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {isCreating ? "CREATING..." : "CREATE"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-1.5 border border-terminal-700 text-xs hover:bg-terminal-800"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Command Input */}
          {!isBooting && !showForm && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-terminal-500">sys&gt;</span>
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
                <div
                  className="absolute top-0 h-5 w-2 bg-emerald-500 pointer-events-none animate-pulse"
                  style={{ left: `${command.length * 9.6}px` }}
                />
              </div>
            </div>
          )}

          {/* Booting indicator */}
          {isBooting && (
            <div className="mt-4 flex items-center gap-2 text-emerald-400 animate-pulse">
              <span>⟳</span>
              <span>LOADING MODULE...</span>
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
