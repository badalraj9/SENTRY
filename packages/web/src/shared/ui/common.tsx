import * as React from 'react';
import { cn } from '../lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   Kbd (Keyboard Shortcut) Component
   Terminal-style keyboard shortcut display
   ═══════════════════════════════════════════════════════════════════════════ */

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[1.25rem] h-5 px-1.5',
        'text-[10px] font-mono font-medium',
        'bg-terminal-800 text-terminal-400',
        'border border-terminal-600 rounded',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Avatar Component
   User avatar with fallback initials
   ═══════════════════════════════════════════════════════════════════════════ */

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
}

const avatarSizes = {
  sm: 'w-6 h-6 text-2xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function Avatar({ className, src, alt, fallback, size = 'md', status, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className={cn('relative inline-flex', className)} {...props}>
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'bg-terminal-800 text-terminal-400 font-mono font-medium',
          'border border-terminal-700',
          avatarSizes[size]
        )}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || fallback}
            className="w-full h-full rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{fallback.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-2 h-2 rounded-full border border-terminal-900',
            status === 'online' && 'bg-success',
            status === 'offline' && 'bg-terminal-600',
            status === 'busy' && 'bg-warning'
          )}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Badge Component
   Status and label badges
   ═══════════════════════════════════════════════════════════════════════════ */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const badgeVariants = {
  default: 'bg-terminal-800 text-terminal-400',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  error: 'bg-error-muted text-error',
  info: 'bg-info-muted text-info',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5',
        'text-[10px] font-mono font-medium rounded',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Skeleton Component
   Loading placeholder
   ═══════════════════════════════════════════════════════════════════════════ */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('bg-terminal-800 rounded animate-pulse', className)}
      {...props}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Divider Component
   ═══════════════════════════════════════════════════════════════════════════ */

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({ className, orientation = 'horizontal', ...props }: DividerProps) {
  return (
    <div
      className={cn(
        'bg-terminal-700',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className
      )}
      {...props}
    />
  );
}
