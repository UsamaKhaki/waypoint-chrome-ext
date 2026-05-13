import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const sideClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[side];

  return (
    <div className={cn('group relative inline-flex', className)}>
      {children}
      <span
        className={cn(
          'absolute z-50 px-2 py-1 text-xs rounded-lg whitespace-nowrap pointer-events-none',
          'bg-surface-elevated border border-border text-secondary',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          sideClass
        )}
      >
        {content}
      </span>
    </div>
  );
}
