'use client';

import { cn } from '@/lib/utils';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('inline-block h-full w-px shrink-0 bg-border', className)}
      />
    );
  }
  return (
    <hr
      role="separator"
      aria-orientation="horizontal"
      className={cn('my-0 h-px w-full shrink-0 border-0 bg-border', className)}
    />
  );
}

export { Separator };
