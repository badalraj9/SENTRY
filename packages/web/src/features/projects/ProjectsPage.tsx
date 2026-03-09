import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetProjectQuery,
} from "../../shared/api/apiSlice";
import { useAppSelector } from "../../store/hooks";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Lock,
  Globe,
  Users,
  ArrowRight,
  Calendar,
  MoreHorizontal,
  Search,
  Filter,
  Terminal,
} from "lucide-react";
import { EmptyState, GlassButton } from "../../shared/ui";
import { cn } from "../../shared/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: "public" | "private" | "invite_only";
  ownerId: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects = [], isLoading: projectsLoading } =
    useGetProjectsQuery();
  const { data: selectedProject } = useGetProjectQuery(projectId || "", {
    skip: !projectId,
  });
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query),
    );
  }, [projects, searchQuery]);

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
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (projectId && selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => navigate("/projects")}
      />
    );
  }

  return (
    <div className="h-full w-full bg-transparent flex flex-col p-6">
      <div className="flex-1 border border-neutral-200 border-b-[3px] rounded-3xl bg-white flex flex-col overflow-hidden relative shadow-sm transition-all duration-150">
        {/* Toolbar Header */}
        <div className="h-20 min-h-[80px] border-b border-neutral-200 px-8 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-6 w-full max-w-2xl">
            <div className="flex items-center gap-3 text-neutral-400">
              <FolderKanban className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.15em] font-mono uppercase hidden sm:inline-block">
                Directories
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-200 hidden sm:block" />

            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                strokeWidth={1.5}
              />
              <input
                type="text"
                placeholder="QUERY DIRECTORIES..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 text-[12px] font-mono text-black rounded-full outline-none focus:border-black transition-colors"
              />
            </div>

            {/* Filter Toggle */}
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200 hover:bg-neutral-50 hover:border-black transition-colors shrink-0">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-[10px] tracking-[0.15em] font-mono uppercase text-neutral-600">
                Filter
              </span>
            </button>
          </div>

          <GlassButton
            onClick={() => setShowForm(true)}
            size="md"
            className="ml-4 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[10px] tracking-[0.15em] uppercase">
              [ INIT DIR ]
            </span>
          </GlassButton>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto bg-transparent relative min-h-[400px]">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="font-mono text-neutral-200 text-[120px] leading-none mb-6">
                #
              </div>
              <div className="font-header text-[32px] tracking-tighter text-black uppercase mb-2">
                NO DIRECTORIES FOUND
              </div>
              <div className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono mt-2">
                CREATE A NEW DIRECTORY TO PROCEED.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 border-b border-neutral-200">
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onClick={() => navigate(`/p/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md p-6">
          <div className="w-full max-w-[500px] border border-neutral-300 border-b-[4px] bg-white shadow-2xl flex flex-col rounded-3xl overflow-hidden relative">
            <div className="p-8 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h2 className="font-header text-2xl text-black uppercase tracking-widest">
                Initialize Directory
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-10 h-10 rounded-full border border-neutral-200 hover:border-[#D33E33] text-neutral-500 flex items-center justify-center hover:text-[#D33E33] transition-colors bg-white"
              >
                <Terminal className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form
              onSubmit={handleCreateProject}
              className="p-8 flex flex-col gap-8 bg-transparent"
            >
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase font-mono text-neutral-500 mb-3">
                  Directory Designation *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="input-brutal w-full py-4 text-lg rounded-full"
                  placeholder="INPUT TITLE..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase font-mono text-neutral-500 mb-3">
                  Summary
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="input-brutal w-full py-4 px-6 text-lg resize-none rounded-3xl"
                  placeholder="INPUT DESCRIPTION..."
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase font-mono text-neutral-500 mb-3">
                  Visibility Status
                </label>
                <select
                  name="visibility"
                  defaultValue="private"
                  className="input-brutal w-full py-4 px-6 text-lg appearance-none bg-white rounded-full"
                >
                  <option value="public">PUBLIC ACCESSIBLE</option>
                  <option value="private">PRIVATE SECURE</option>
                  <option value="invite_only">RESTRICTED</option>
                </select>
              </div>

              <div className="flex gap-4 pt-6 mt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-4 border border-neutral-300 text-[10px] tracking-[0.15em] uppercase font-mono text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors rounded-full"
                >
                  [ ABORT ]
                </button>
                <GlassButton
                  type="submit"
                  disabled={isCreating}
                  size="md"
                  className="flex-1"
                >
                  {isCreating ? "INITIALIZING..." : "[ COMMIT ]"}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  index,
  onClick,
}: {
  project: Project;
  index: number;
  onClick: () => void;
}) {
  const visibilityConfig = {
    public: { icon: Globe, label: "Public", color: "text-info" },
    private: { icon: Lock, label: "Private", color: "text-warning" },
    invite_only: {
      icon: Users,
      label: "Invite Only",
      color: "text-purple-400",
    },
  };

  const config = visibilityConfig[project.visibility];
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className="group p-8 border-b border-r border-neutral-200 hover:bg-neutral-50 cursor-pointer flex flex-col justify-between h-[320px] transition-all relative z-0 hover:z-10 hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] bg-white"
    >
      <div>
        <div className="flex items-start justify-between mb-8">
          <div className="w-12 h-12 rounded-full border border-neutral-200 bg-transparent group-hover:bg-white group-hover:border-neutral-300 flex items-center justify-center transition-colors">
            <FolderKanban
              className="w-5 h-5 text-neutral-500 group-hover:text-black transition-colors"
              strokeWidth={1.5}
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-8 h-8 rounded-full border border-transparent hover:border-neutral-200 text-neutral-500 flex items-center justify-center hover:text-black transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-[32px] font-bold font-header tracking-tighter leading-none text-black uppercase mb-4 truncate transition-colors">
          {project.name}
        </h3>
        <p className="font-sans text-[15px] tracking-wide text-neutral-500 line-clamp-3 transition-colors">
          {project.description || "NO DESCRIPTION ATTACHED"}
        </p>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-neutral-200 transition-colors">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase">
          <Icon
            className={cn("w-4 h-4 transition-colors", config.color)}
            strokeWidth={1.5}
          />
          <span className="text-neutral-700">{config.label}</span>
        </div>
        <div className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono transition-colors">
          <span>
            {formatDistanceToNow(new Date(project.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      <div className="absolute right-8 top-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-black" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full bg-transparent flex flex-col p-6">
      <div className="flex-1 border border-neutral-200 border-b-[3px] rounded-3xl bg-white flex flex-col overflow-hidden relative shadow-sm transition-all duration-150">
        {/* Header */}
        <div className="h-24 border-b border-neutral-200 flex items-center justify-between px-10 bg-transparent z-10 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="px-4 py-2 border border-neutral-200 rounded-full text-[10px] tracking-[0.1em] font-mono hover:bg-neutral-100 hover:text-black transition-colors"
              >
                [ BACK ]
              </button>
            </div>
            <div className="h-8 w-px bg-neutral-200" />
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-neutral-200 rounded-full flex items-center justify-center bg-transparent">
                <FolderKanban
                  className="w-5 h-5 text-neutral-500"
                  strokeWidth={1.5}
                />
              </div>
              <span className="font-header font-bold text-[28px] tracking-tighter text-black uppercase mt-1">
                {project.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] tracking-[0.1em] font-mono text-neutral-500 uppercase">
              ESTABLISHED:{" "}
              {formatDistanceToNow(new Date(project.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-12 border-b border-neutral-200 flex flex-col gap-6">
            <h2 className="font-header font-bold text-[48px] tracking-tighter leading-none text-black uppercase">
              Directory Overview
            </h2>
            <p className="font-sans text-[18px] tracking-wide text-neutral-500 max-w-3xl leading-relaxed">
              {project.description || "NO DETAILS PROVIDED FOR THIS RECORD."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
            <button
              onClick={() => navigate(`/messages?project=${project.id}`)}
              className="flex flex-col p-12 text-left group transition-all duration-150 z-0 hover:z-10 hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:bg-neutral-50 bg-white"
            >
              <div className="font-header font-bold text-[32px] tracking-tighter leading-none text-black mb-6 flex items-center justify-between w-full">
                <span>COMM LOGS</span>
                <div className="w-10 h-10 border border-neutral-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-white bg-transparent">
                  <ArrowRight
                    className="w-5 h-5 text-black"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-[0.1em] text-neutral-500 mt-auto">
                ACCESS SYSTEM CHATTER
              </p>
            </button>

            <button
              onClick={() => navigate(`/decisions?project=${project.id}`)}
              className="flex flex-col p-12 text-left group transition-all duration-150 z-0 hover:z-10 hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:bg-neutral-50 bg-white"
            >
              <div className="font-header font-bold text-[32px] tracking-tighter leading-none text-black mb-6 flex items-center justify-between w-full">
                <span>DECISION MATRIX</span>
                <div className="w-10 h-10 border border-neutral-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-white bg-transparent">
                  <ArrowRight
                    className="w-5 h-5 text-black"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-[0.1em] text-neutral-500 mt-auto">
                REVIEW ACTIONABLE CHOICES
              </p>
            </button>

            <button
              onClick={() => navigate(`/documents?project=${project.id}`)}
              className="flex flex-col p-12 text-left group transition-all duration-150 z-0 hover:z-10 hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:bg-neutral-50 bg-white"
            >
              <div className="font-header font-bold text-[32px] tracking-tighter leading-none text-black mb-6 flex items-center justify-between w-full">
                <span>ARCHIVES</span>
                <div className="w-10 h-10 border border-neutral-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-white bg-transparent">
                  <ArrowRight
                    className="w-5 h-5 text-black"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-[0.1em] text-neutral-500 mt-auto">
                ACCESS STORED RECORDS
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
