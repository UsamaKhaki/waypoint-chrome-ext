import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, ...props }, ref) => (
    <div className="relative flex items-center">
      {leftIcon && (
        <span className="absolute left-3 text-muted pointer-events-none">{leftIcon}</span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl bg-surface border border-border-subtle text-primary placeholder:text-muted',
          'px-3 py-2 text-sm outline-none',
          'focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-150',
          leftIcon && 'pl-9',
          rightIcon && 'pr-9',
          className
        )}
        {...props}
      />
      {rightIcon && <span className="absolute right-3 text-muted">{rightIcon}</span>}
    </div>
  )
);
Input.displayName = 'Input';
