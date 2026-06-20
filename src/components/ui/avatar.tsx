'use client';

import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-indigo-500',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length] ?? 'bg-blue-500';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] ?? '').charAt(0).toUpperCase();
  return ((parts[0] ?? '').charAt(0) + (parts[parts.length - 1] ?? '').charAt(0)).toUpperCase();
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

function Avatar({ name, size = 'md', className }: AvatarProps) {
  const color = getColorFromName(name);
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white shrink-0',
        sizeClasses[size],
        color,
        className,
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

export { Avatar };
