'use client';

import { Editor } from '@tiptap/react';
import type { Range } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  GitPullRequest,
  Minus,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   Slash Command Menu
   Terminal-style command palette for inserting blocks
   ═══════════════════════════════════════════════════════════════════════════ */

interface CommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  command: (props: { editor: Editor; range: Range }) => void;
}

export const SLASH_COMMANDS: CommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list of items',
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Display code with syntax',
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Divider',
    description: 'Visual section break',
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: 'Decision',
    description: 'Embed a decision card',
    icon: GitPullRequest,
    command: ({ editor, range }) => {
      // TODO: In a real app, this would open a modal to select a decision
      editor.chain().focus().deleteRange(range).insertContent({
        type: 'decisionEmbed',
        attrs: {
          id: String(Math.floor(Math.random() * 1000)),
          title: 'New Decision Placeholder',
          status: 'draft',
        },
      }).run();
    },
  },
];

interface SlashCommandMenuProps {
  editor: Editor;
  range: Range;
  items: CommandItem[];
  selectedIndex: number;
  onSelect: (item: CommandItem) => void;
}

export function SlashCommandMenu({
  items,
  selectedIndex,
  onSelect,
}: SlashCommandMenuProps) {
  return (
    <div className={cn(
      'w-72 bg-terminal-900 border border-terminal-700 rounded-lg shadow-xl overflow-hidden',
      'animate-slide-down'
    )}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-terminal-800">
        <span className="text-[10px] font-mono uppercase tracking-wider text-terminal-500">
          Insert Block
        </span>
      </div>

      {/* Commands */}
      <div className="max-h-64 overflow-y-auto py-1">
        {items.length === 0 ? (
          <div className="px-3 py-2 text-sm text-terminal-500 font-mono">
            No results found
          </div>
        ) : (
          items.map((item, index) => (
            <button
              key={item.title}
              onClick={() => onSelect(item)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2',
                'text-left transition-colors duration-100',
                index === selectedIndex
                  ? 'bg-terminal-800 text-terminal-100'
                  : 'text-terminal-400 hover:bg-terminal-850 hover:text-terminal-200'
              )}
            >
              <div className={cn(
                'p-1.5 rounded',
                index === selectedIndex
                  ? 'bg-accent-muted text-accent'
                  : 'bg-terminal-800 text-terminal-500'
              )}>
                <item.icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono">{item.title}</div>
                <div className="text-xs text-terminal-500 truncate">
                  {item.description}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-terminal-800 bg-terminal-950">
        <span className="text-[10px] font-mono text-terminal-500">
          ↑↓ Navigate • ↵ Select • Esc Close
        </span>
      </div>
    </div>
  );
}

export default SlashCommandMenu;
