'use client';

import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'default';
}

const colorConfig = {
  blue: {
    wrapper: 'bg-blue-50',
    icon: 'text-blue-600',
  },
  green: {
    wrapper: 'bg-green-50',
    icon: 'text-green-600',
  },
  red: {
    wrapper: 'bg-red-50',
    icon: 'text-red-600',
  },
  orange: {
    wrapper: 'bg-orange-50',
    icon: 'text-orange-600',
  },
  purple: {
    wrapper: 'bg-purple-50',
    icon: 'text-purple-600',
  },
  default: {
    wrapper: 'bg-muted',
    icon: 'text-muted-foreground',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, color = 'default' }: StatCardProps) {
  const colors = colorConfig[color];

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-semibold text-foreground tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
            colors.wrapper,
          )}
        >
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>
      </div>
    </div>
  );
}
