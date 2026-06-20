'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      <Link
        href={'/' as never}
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            {isLast || !item.href ? (
              <span
                className={cn(
                  'font-medium',
                  isLast ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href as never}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
