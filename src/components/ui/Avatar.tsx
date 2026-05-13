import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
};

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        onError={() => setImgError(true)}
        className={cn('rounded-full object-cover flex-shrink-0', SIZE[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 font-semibold text-accent select-none',
        SIZE[size],
        className
      )}
    >
      {name ? initials(name) : '?'}
    </div>
  );
}
