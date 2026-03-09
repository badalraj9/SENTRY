import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  useGetDecisionsQuery,
  useGetProjectsQuery,
  useCreateDecisionMutation,
} from "../../shared/api/apiSlice";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitPullRequest,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Terminal,
  ChevronRight,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmptyState, GlassButton, LiquidTabs } from "../../shared/ui";
import { cn } from "../../shared/lib/utils";

interface Decision {
  id: string;
  statement?: string;
  status?: string;
  deprecated?: boolean;
  createdAt?: string;
}

export default function DecisionsPage() {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "approved" | "rejected"
  >("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects = [] } = useGetProjectsQuery();
  const { data: decisions = [] } = useGetDecisionsQuery(
    selectedProjectId || "",
    {
      skip: !selectedProjectId,
    },
  );
  const [createDecision, { isLoading: isCreating }] =
    useCreateDecisionMutation();

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const filteredDecisions = useMemo(() => {
    let result = decisions;
    if (filter === "active") {
      result = decisions.filter((d: Decision) => !d.deprecated);
    } else if (filter === "approved") {
      result = decisions.filter((d: Decision) => d.status === "approved");
    } else if (filter === "rejected") {
      result = decisions.filter((d: Decision) => d.status === "rejected");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((d: Decision) =>
        d.statement?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [decisions, filter, searchQuery]);

  const handleCreateDecision = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    const formData = new FormData(e.currentTarget);
    const statement = formData.get("statement") as string;
    const rationale = formData.get("rationale") as string;

    if (!statement) return;

    try {
      await createDecision({
        projectId: selectedProjectId,
        statement,
        rationale,
      }).unwrap();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create decision:", error);
    }
  };

  return (
    <div className="h-full w-full bg-transparent overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-full flex flex-col glass-card m-4 overflow-hidden"
        >
          {/* Toolbar Header */}
          <div className="p-6 md:px-8 md:py-4 border-b border-white/60 glass-header rounded-t-3xl shrink-0 flex flex-col gap-4 z-10 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GitPullRequest
                  className="w-5 h-5 text-neutral-400"
                  strokeWidth={1.5}
                />
                <span className="text-[10px] tracking-[0.15em] font-mono uppercase text-neutral-400">
                  Decisions
                </span>
              </div>
              <GlassButton
                onClick={() => setShowCreateModal(true)}
                disabled={!selectedProjectId}
                size="sm"
              >
                <Plus className="w-4 h-4" />[ NEW DECISION ]
              </GlassButton>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              {/* Project Selector */}
              {projects.length > 0 && (
                <LiquidTabs
                  layoutId="decisions-project-selector"
                  tabs={projects.map((p) => ({ value: p.id, label: p.name }))}
                  active={selectedProjectId || projects[0]?.id || ""}
                  onChange={(id) => setSelectedProjectId(id)}
                  size="sm"
                />
              )}

              {/* Search & Filter */}
              <div className="flex gap-3">
                <div className="relative w-64 group hidden lg:block">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                  <input
                    type="text"
                    placeholder="SEARCH DECISIONS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-5 py-2 bg-neutral-50 border border-neutral-200 rounded-full text-[11px] font-mono tracking-[0.1em] text-black placeholder:text-neutral-400 focus:border-black transition-colors outline-none"
                  />
                </div>
                <LiquidTabs
                  layoutId="decisions-status-filter"
                  tabs={[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                  active={filter}
                  onChange={(v) => setFilter(v as typeof filter)}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Decisions List */}
          <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
            {filteredDecisions.length === 0 ? (
              <EmptyState
                icon={GitPullRequest}
                title={searchQuery ? "No decisions found" : "No Decisions Yet"}
                description={
                  searchQuery
                    ? "Try adjusting your search"
                    : "Create your first decision to start tracking project choices."
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDecisions.map((decision: Decision, index: number) => (
                  <motion.div
                    key={decision.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group p-6 rounded-3xl bg-white border border-neutral-200 border-b-[3px] hover:border-black cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex flex-col gap-4 h-full">
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className={cn(
                            "p-2.5 rounded-full border",
                            decision.status === "approved"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : decision.status === "rejected"
                                ? "bg-[#D33E33]/10 text-[#D33E33] border-[#D33E33]/30"
                                : "bg-neutral-100 text-neutral-600 border-neutral-300",
                          )}
                        >
                          {decision.status === "approved" ? (
                            <CheckCircle
                              className="w-5 h-5"
                              strokeWidth={1.5}
                            />
                          ) : decision.status === "rejected" ? (
                            <XCircle className="w-5 h-5" strokeWidth={1.5} />
                          ) : (
                            <AlertCircle
                              className="w-5 h-5"
                              strokeWidth={1.5}
                            />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[9px] tracking-[0.15em] font-mono uppercase px-3 py-1 rounded-full border",
                            decision.status === "approved"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : decision.status === "rejected"
                                ? "bg-[#D33E33]/10 text-[#D33E33] border-[#D33E33]/30"
                                : "bg-neutral-50 text-neutral-600 border-neutral-300",
                          )}
                        >
                          {decision.status || "pending"}
                        </span>
                      </div>

                      <div className="mt-2 flex-1">
                        <h3 className="text-[14px] font-mono font-bold tracking-[0.05em] uppercase text-black leading-snug">
                          {decision.statement || "Untitled Decision"}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
                        {decision.createdAt && (
                          <span className="text-[10px] text-neutral-500 font-mono tracking-[0.1em] flex items-center gap-2 uppercase">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDistanceToNow(new Date(decision.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                        <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Create Decision Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md"
                onClick={() => setShowCreateModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md p-8 mx-4 rounded-3xl bg-white border border-neutral-200 border-b-[4px]"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="font-header text-[28px] tracking-tighter uppercase font-bold text-black">
                      New Decision
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors group"
                    >
                      <X className="w-5 h-5 text-neutral-400 group-hover:text-black" />
                    </button>
                  </div>
                  <form onSubmit={handleCreateDecision} className="space-y-6">
                    <div>
                      <label className="block text-[10px] tracking-[0.1em] uppercase font-mono text-neutral-500 mb-2">
                        Decision Statement *
                      </label>
                      <textarea
                        name="statement"
                        required
                        rows={3}
                        className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-[12px] font-mono text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors resize-none shadow-inner"
                        placeholder="What decision needs to be made?"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.1em] uppercase font-mono text-neutral-500 mb-2">
                        Rationale
                      </label>
                      <textarea
                        name="rationale"
                        rows={3}
                        className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-[12px] font-mono text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors resize-none shadow-inner"
                        placeholder="Why is this decision important?"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <GlassButton
                        type="submit"
                        disabled={isCreating}
                        size="md"
                        className="flex-1"
                      >
                        {isCreating ? "CREATING..." : "CREATE"}
                      </GlassButton>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-8 py-4 bg-transparent border border-neutral-200 text-neutral-500 hover:text-black hover:border-black rounded-full font-mono text-[11px] tracking-[0.15em] uppercase transition-all duration-150 hover:scale-[0.98] active:scale-95"
                      >
                        CANCEL
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
