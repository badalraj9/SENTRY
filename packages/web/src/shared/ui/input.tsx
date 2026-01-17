import * as React from 'react';
import { cn } from '../lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   Input Component
   Terminal-style inputs with monospace font
   ═══════════════════════════════════════════════════════════════════════════ */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-9 w-full px-3 py-2 text-sm font-mono',
          'bg-terminal-950 border border-terminal-700 rounded',
          'text-terminal-200 placeholder:text-terminal-500',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-150',
          error && 'border-error focus:border-error focus:ring-error',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

/* ═══════════════════════════════════════════════════════════════════════════
   Textarea Component
   ═══════════════════════════════════════════════════════════════════════════ */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full px-3 py-2 text-sm font-mono resize-none',
          'bg-terminal-950 border border-terminal-700 rounded',
          'text-terminal-200 placeholder:text-terminal-500',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-150',
          error && 'border-error focus:border-error focus:ring-error',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
