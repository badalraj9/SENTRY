import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Code, Strikethrough, Link } from 'lucide-react';
import DecisionNode from '../extensions/DecisionNode';
import { cn } from '../../../shared/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   DocEditor Component
   Terminal-style block editor built on Tiptap
   ═══════════════════════════════════════════════════════════════════════════ */

interface DocEditorProps {
  content?: string;
  isReadOnly?: boolean;
  onChange?: (content: string) => void;
}

export function DocEditor({ content = '', isReadOnly = false, onChange }: DocEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-terminal-900 p-4 rounded-md font-mono text-sm border border-terminal-700 my-4',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'bg-terminal-800 text-accent px-1.5 py-0.5 rounded font-mono text-sm',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-2 border-terminal-600 pl-4 my-4 text-terminal-400 italic',
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: 'border-terminal-700 my-8',
          },
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Document Title...';
          }
          return "Type '/' for commands...";
        },
        emptyEditorClass: 'is-editor-empty',
      }),
      DecisionNode,
    ],
    content,
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert max-w-none focus:outline-none min-h-[400px]',
          // Headings
          'prose-headings:font-sans prose-headings:tracking-tight prose-headings:text-terminal-100',
          'prose-headings:font-semibold prose-headings:mb-4 prose-headings:mt-8',
          'prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
          // Paragraphs
          'prose-p:text-terminal-300 prose-p:leading-relaxed prose-p:my-3',
          // Links
          'prose-a:text-accent prose-a:no-underline hover:prose-a:underline',
          // Lists
          'prose-ul:my-4 prose-ol:my-4 prose-li:text-terminal-300',
          'prose-li:marker:text-terminal-500',
          // Strong/Em
          'prose-strong:text-terminal-200 prose-strong:font-semibold',
          'prose-em:text-terminal-300',
          // HR
          'prose-hr:border-terminal-700'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Keyboard shortcut for slash command (simple implementation)
  React.useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && editor.isFocused) {
        // For now, just log - a full implementation would use Tiptap's Suggestion extension
        console.log('Slash command triggered - implement Suggestion extension for full functionality');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[400px] w-full flex items-center justify-center">
        <div className="text-terminal-500 font-mono text-sm">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Floating Toolbar (Bubble Menu) - Commented out for build fix
      <BubbleMenu 
        editor={editor} 
        tippyOptions={{ 
          duration: 100,
          placement: 'top',
        }} 
        className={cn(
          'flex bg-terminal-900 border border-terminal-700 rounded-md shadow-xl overflow-hidden',
          'animate-fade-in'
        )}
      >
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code (Ctrl+E)"
        >
          <Code size={14} />
        </ToolbarButton>
      </BubbleMenu>
      */}

      {/* Editor Canvas */}
      <EditorContent 
        editor={editor} 
        className="editor-content"
      />

      {/* Editor styles */}
      <style>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #71717a;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #71717a;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'px-3 py-2 transition-colors duration-100',
        'hover:bg-terminal-800',
        active 
          ? 'text-accent bg-terminal-800' 
          : 'text-terminal-400 hover:text-terminal-100'
      )}
    >
      {children}
    </button>
  );
}

export default DocEditor;
