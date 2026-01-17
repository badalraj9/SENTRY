'use client';

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MoreHorizontal, FileText, Clock, User } from 'lucide-react';
import { DocEditor } from '../editor';
import { cn } from '../../shared/lib/utils';
import { Button } from '../../shared/ui';
import { useGetDocumentsQuery, useGetProjectsQuery } from '../../shared/api/apiSlice';

/* ═══════════════════════════════════════════════════════════════════════════
   Documents Page
   Document list + editor view
   ═══════════════════════════════════════════════════════════════════════════ */

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

  // Real Data Fetch
  const { data: projects = [] } = useGetProjectsQuery();
  const activeProjectId = projects[0]?.id || 'mock-id';
  const { data: documents = [], isLoading } = useGetDocumentsQuery({ projectId: activeProjectId }, { skip: !activeProjectId });

  // Mock Fallback if API fails or empty
  const MOCK_DOCUMENTS = [
    { id: '1', title: 'Project Overview', updatedAt: '2026-01-15T10:30:00Z', createdBy: 'Alex' },
    { id: '2', title: 'Technical Architecture', updatedAt: '2026-01-14T15:45:00Z', createdBy: 'Jordan' },
    { id: '3', title: 'API Documentation', updatedAt: '2026-01-13T09:20:00Z', createdBy: 'Sam' },
    { id: '4', title: 'User Research Notes', updatedAt: '2026-01-12T14:00:00Z', createdBy: 'Taylor' },
  ];

  const displayDocs = documents.length > 0 ? documents.map(d => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt,
    createdBy: 'You' // Simplified
  })) : MOCK_DOCUMENTS;

  const [content, setContent] = React.useState(SAMPLE_CONTENT);
  const [isSaving, setIsSaving] = React.useState(false);

  const selectedDoc = docId ? displayDocs.find(d => d.id === docId) : null;

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 500));
    setIsSaving(false);
    console.log('Document saved:', content);
  };

  // Document list view
  if (!docId) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-terminal-700">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-terminal-500" />
            <h1 className="text-lg font-semibold text-terminal-200">Documents</h1>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/documents/new')}>
            New Document
          </Button>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-2">
            {displayDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className={cn(
                  'w-full flex items-center gap-4 p-4',
                  'bg-terminal-900 border border-terminal-700 rounded-md',
                  'hover:border-terminal-600 hover:bg-terminal-850',
                  'transition-colors duration-150 text-left group'
                )}
              >
                <FileText className="w-5 h-5 text-terminal-500 group-hover:text-terminal-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-terminal-200 group-hover:text-terminal-100">
                    {doc.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-terminal-500">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {doc.createdBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
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
            onClick={() => navigate('/documents')}
            className="p-1.5 rounded hover:bg-terminal-800 text-terminal-500 hover:text-terminal-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-medium text-terminal-200">
              {selectedDoc?.title || 'New Document'}
            </h1>
            <p className="text-xs text-terminal-500 font-mono">
              {selectedDoc ? `Updated ${new Date(selectedDoc.updatedAt).toLocaleDateString()}` : 'Unsaved'}
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
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <button className="p-2 rounded hover:bg-terminal-800 text-terminal-500 hover:text-terminal-300 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-12 px-8">
          <DocEditor
            content={content}
            onChange={setContent}
          />
        </div>
      </div>
    </div>
  );
}

export default DocumentsPage;
