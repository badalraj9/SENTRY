import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  MoreHorizontal,
  FileText,
  Clock,
  User,
  Plus,
  Search,
  ChevronRight,
  X,
} from "lucide-react";
import { DocEditor } from "../editor";
import { Button, EmptyState, GlassButton } from "../../shared/ui";
import {
  useGetDocumentsQuery,
  useGetProjectsQuery,
  useCreateDocumentMutation,
} from "../../shared/api/apiSlice";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../shared/lib/utils";

interface ProjectDoc {
  id: string;
  title: string;
  updatedAt?: string;
  createdBy?: string;
}

const SAMPLE_CONTENT = `
<h1>Technical Architecture Overview</h1>
<p>This document outlines the core architectural decisions for our platform.</p>

<h2>System Design</h2>
<p>Our system follows a <strong>modular, feature-sliced architecture</strong> that promotes scalability and maintainability.</p>

<h2>Next Steps</h2>
<p>We need to finalize the API contract before proceeding with implementation.</p>
`;

export function DocumentsPage() {
  const { docId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [content, setContent] = React.useState(SAMPLE_CONTENT);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const { data: projects = [] } = useGetProjectsQuery();
  const activeProjectId = projects[0]?.id || "";
  const { data: documents = [], isLoading: docsLoading } = useGetDocumentsQuery(
    { projectId: activeProjectId },
    { skip: !activeProjectId },
  );
  const [createDocument, { isLoading: isCreating }] =
    useCreateDocumentMutation();

  const MOCK_DOCUMENTS: ProjectDoc[] = [
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

  const displayDocs: ProjectDoc[] = (
    documents.length > 0 ? documents : MOCK_DOCUMENTS
  ).map((d) => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt,
    createdBy: (d as ProjectDoc).createdBy || "You",
  }));

  const filteredDocs = React.useMemo(() => {
    if (!searchQuery.trim()) return displayDocs;
    const query = searchQuery.toLowerCase();
    return displayDocs.filter((d) => d.title.toLowerCase().includes(query));
  }, [displayDocs, searchQuery]);

  const selectedDoc = docId ? displayDocs.find((d) => d.id === docId) : null;

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
  };

  const handleCreateDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const docType = formData.get("docType") as string;

    if (!title || !activeProjectId) return;

    try {
      const result = await createDocument({
        projectId: activeProjectId,
        title,
        description,
        docType,
      }).unwrap();
      setShowCreateModal(false);
      navigate(`/documents/${result.id}`);
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  if (docId && selectedDoc) {
    return (
      <div className="h-full w-full bg-transparent flex flex-col p-6">
        <div className="flex-1 glass-card flex flex-col overflow-hidden relative transition-all duration-150">
          {/* Editor Header */}
          <div className="h-24 border-b border-white/60 glass-header rounded-t-3xl flex items-center justify-between px-10 z-10 shrink-0">
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate("/documents")}
                className="px-4 py-2 border border-neutral-200 rounded-full text-[10px] tracking-[0.1em] font-mono hover:bg-neutral-100 hover:text-black transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                <span>[ BACK ]</span>
              </button>
              <div className="h-6 w-px bg-neutral-200" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-neutral-200 rounded-full flex items-center justify-center bg-transparent">
                  <FileText
                    className="w-5 h-5 text-neutral-500"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="font-header font-bold text-[28px] tracking-tighter text-black uppercase mt-1">
                  {selectedDoc.title}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[10px] tracking-[0.1em] font-mono uppercase text-neutral-500">
                LAST SAVED:{" "}
                {selectedDoc.updatedAt
                  ? formatDistanceToNow(new Date(selectedDoc.updatedAt), {
                      addSuffix: true,
                    })
                  : "JUST NOW"}
              </span>
              <GlassButton onClick={handleSave} disabled={isSaving} size="md">
                {isSaving ? "SAVING..." : "[ COMMIT RECORD ]"}
              </GlassButton>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-hidden relative">
            <DocEditor content={content} onChange={setContent} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-transparent flex flex-col p-6">
      <div className="flex-1 border border-neutral-200 border-b-[3px] rounded-3xl bg-white flex flex-col overflow-hidden relative shadow-sm transition-all duration-150">
        {/* Toolbar Header */}
        <div className="h-20 min-h-[80px] border-b border-neutral-200 px-8 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-6 w-full max-w-2xl">
            <div className="flex items-center gap-3 text-neutral-400">
              <FileText className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.15em] font-mono uppercase hidden sm:inline-block">
                Records
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
                placeholder="QUERY RECORDS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 text-[12px] font-mono text-black rounded-full outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <GlassButton
            onClick={() => setShowCreateModal(true)}
            size="md"
            className="ml-4 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[10px] tracking-[0.15em] uppercase">
              [ CREATE ]
            </span>
          </GlassButton>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-transparent">
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="font-mono text-neutral-200 text-[120px] leading-none mb-6">
                #
              </div>
              <div className="font-header text-[32px] tracking-tighter text-black uppercase mb-2">
                NO RECORDS FOUND
              </div>
              <div className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 font-mono mt-2">
                CREATE A RECORD TO BEGIN LOGGING.
              </div>
            </div>
          ) : (
            <div className="flex flex-col border-b border-neutral-200">
              <div className="grid grid-cols-12 gap-6 p-6 border-b border-neutral-200 bg-transparent sticky top-0 z-10">
                <div className="col-span-6 text-[10px] tracking-[0.1em] font-mono text-neutral-500 uppercase">
                  Title
                </div>
                <div className="col-span-3 text-[10px] tracking-[0.1em] font-mono text-neutral-500 uppercase">
                  Author
                </div>
                <div className="col-span-3 text-[10px] tracking-[0.1em] font-mono text-neutral-500 uppercase text-right pr-12">
                  Last Modified
                </div>
              </div>

              {filteredDocs.map((doc, index) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="grid grid-cols-12 gap-6 p-6 border-b border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer group items-center"
                >
                  <div className="col-span-6 flex items-center gap-6 w-full min-w-0">
                    <div className="w-10 h-10 border border-neutral-200 rounded-full flex items-center justify-center shrink-0 group-hover:bg-white group-hover:border-black/20 transition-colors">
                      <FileText
                        className="w-5 h-5 text-neutral-500 group-hover:text-black transition-colors"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="font-header text-[22px] tracking-tighter text-black uppercase truncate mt-1 group-hover:translate-x-1 transition-transform">
                      {doc.title}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center bg-transparent">
                      <User
                        className="w-4 h-4 text-neutral-500"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="font-sans text-[15px] font-medium tracking-wide text-neutral-600 uppercase truncate">
                      {doc.createdBy || "System"}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-6">
                    <span className="text-[10px] tracking-[0.1em] font-mono text-neutral-500 uppercase">
                      {doc.updatedAt
                        ? formatDistanceToNow(new Date(doc.updatedAt), {
                            addSuffix: true,
                          })
                        : "JUST NOW"}
                    </span>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 rounded-full border border-transparent hover:border-neutral-200 text-neutral-500 hover:text-black transition-colors flex items-center justify-center"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md p-6">
          <div className="w-full max-w-[500px] border border-neutral-200 border-b-[4px] bg-white shadow-2xl flex flex-col rounded-3xl overflow-hidden relative">
            <div className="p-8 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h2 className="font-header text-2xl text-black uppercase tracking-widest">
                Initialize Record
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 rounded-full border border-neutral-200 hover:border-[#D33E33]/50 text-neutral-500 hover:text-[#D33E33] transition-colors flex items-center justify-center bg-white"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form
              onSubmit={handleCreateDocument}
              className="p-8 flex flex-col gap-8 bg-transparent"
            >
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase font-mono text-neutral-500 mb-3">
                  Record Designation *
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  className="input-brutal w-full py-4 px-6 text-lg rounded-full"
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
                  Classification
                </label>
                <select
                  name="docType"
                  defaultValue="general"
                  className="input-brutal w-full py-4 px-6 text-lg appearance-none bg-white rounded-full"
                >
                  <option value="general">GENERAL LOG</option>
                  <option value="adr">ARCH. DECISION [ADR]</option>
                  <option value="rfc">REQUEST FOR COMMENT [RFC]</option>
                  <option value="spec">SYSTEM SPEC</option>
                  <option value="meeting_notes">SYNC RECORD</option>
                  <option value="runbook">EXECUTIVE RUNBOOK</option>
                </select>
              </div>

              <div className="flex gap-4 pt-6 mt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 border border-neutral-200 text-[10px] tracking-[0.15em] uppercase font-mono text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors rounded-full"
                >
                  [ ABORT ]
                </button>
                <GlassButton
                  type="submit"
                  disabled={isCreating || !activeProjectId}
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

export default DocumentsPage;
