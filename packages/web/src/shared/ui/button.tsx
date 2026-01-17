import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Button Component
   Terminal-inspired, minimal, instant feedback
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

const variantStyles = {
  primary: 'bg-accent text-terminal-950 hover:bg-accent-hover active:bg-accent',
  secondary: 'bg-terminal-800 text-terminal-200 hover:bg-terminal-700 border border-terminal-700',
  ghost: 'text-terminal-400 hover:text-terminal-200 hover:bg-terminal-800',
  danger: 'bg-error text-white hover:bg-red-600',
};

const sizeStyles = {
  sm: 'h-7 px-2 text-xs gap-1',
  md: 'h-8 px-3 text-sm gap-1.5',
  lg: 'h-9 px-4 text-sm gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, disabled, asChild, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded transition-colors duration-150',
          'disabled:opacity-50 disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
