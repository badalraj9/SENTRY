import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { GitPullRequest } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   DecisionNode Extension
   Renders live, interactive Decision cards embedded in the document
   ═══════════════════════════════════════════════════════════════════════════ */

// The React Component (Visuals)
function DecisionComponent({ node }: NodeViewProps) {
  const { id = '000', title = 'Untitled Decision', status = 'draft' } = node.attrs as {
    id?: string;
    title?: string;
    status?: 'draft' | 'approved' | 'rejected';
  };

  const statusConfig = {
    draft: {
      bg: 'bg-warning-muted',
      text: 'text-warning',
      border: 'border-warning/20',
      label: 'Draft',
    },
    approved: {
      bg: 'bg-success-muted',
      text: 'text-success',
      border: 'border-success/20',
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-error-muted',
      text: 'text-error',
      border: 'border-error/20',
      label: 'Rejected',
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <NodeViewWrapper className="my-4 not-prose">
      <div 
        className={cn(
          'flex items-center gap-3 p-3',
          'border border-terminal-700 bg-terminal-900/50 rounded-md',
          'hover:border-success/50 transition-colors cursor-pointer group'
        )}
        onClick={() => {
          // TODO: Open decision detail modal/drawer
          console.log(`View decision: ${id}`);
        }}
      >
        {/* Icon */}
        <div className={cn('p-2 rounded-md', config.bg, config.text)}>
          <GitPullRequest size={18} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-terminal-500">DEC-{id}</span>
            <span className={cn(
              'text-[10px] uppercase px-1.5 py-0.5 rounded border',
              config.border,
              config.text
            )}>
              {config.label}
            </span>
          </div>
          <div className="text-sm font-medium text-terminal-200 group-hover:text-success transition-colors truncate">
            {title}
          </div>
        </div>

        {/* Action hint */}
        <div className="text-xs text-terminal-600 font-mono flex-shrink-0">
          Click to view
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// The Tiptap Extension Definition
const DecisionNode = Node.create({
  name: 'decisionEmbed',
  group: 'block',
  atom: true, // It's a single unit, not editable text

  addAttributes() {
    return {
      id: { default: '000' },
      title: { default: 'Untitled Decision' },
      status: { default: 'draft' },
    };
  },

  parseHTML() {
    return [{ tag: 'decision-embed' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['decision-embed', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DecisionComponent);
  },
});

export default DecisionNode;
