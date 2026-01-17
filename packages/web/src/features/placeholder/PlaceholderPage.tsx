'use client';

import { cn } from '../../shared/lib/utils';
import { Construction, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════════
   Placeholder Page
   Temporary page for features not yet implemented
   ═══════════════════════════════════════════════════════════════════════════ */

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-terminal-950 border-b border-terminal-700 px-6 py-4">
        <h1 className="text-lg font-semibold text-terminal-100">{title}</h1>
      </header>

      {/* Content */}
      <div className="flex flex-col items-center justify-center h-[calc(100%-60px)] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-terminal-800 flex items-center justify-center mb-4">
          <Construction className="w-8 h-8 text-terminal-500" />
        </div>
        
        <h2 className="text-xl font-semibold text-terminal-200 mb-2">
          {title} Coming Soon
        </h2>
        
        <p className="text-sm text-terminal-500 max-w-md mb-6">
          This feature is currently under construction. Check back soon for updates.
        </p>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2',
              'text-sm font-medium rounded',
              'bg-terminal-800 text-terminal-200 hover:bg-terminal-700',
              'border border-terminal-700',
              'transition-colors duration-150'
            )}
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </Link>
        </div>

        {/* Terminal-style status */}
        <div className="mt-12 p-4 bg-terminal-900 border border-terminal-700 rounded-md font-mono text-left max-w-md w-full">
          <div className="text-xs text-terminal-500">
            <span className="text-success">$</span> sentry status --page {title.toLowerCase().replace(' ', '-')}
          </div>
          <div className="text-xs text-terminal-400 mt-2">
            <span className="text-warning">→</span> Phase: Development
          </div>
          <div className="text-xs text-terminal-400">
            <span className="text-warning">→</span> Status: Pending implementation
          </div>
          <div className="text-xs text-terminal-400">
            <span className="text-warning">→</span> ETA: Phase 2-4
          </div>
        </div>
      </div>
    </div>
  );
}
