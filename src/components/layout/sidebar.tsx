'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Users,
  Building2,
  LogOut,
  Settings,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Avatar } from '@/components/ui/avatar';

interface SubItem {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  sub?: SubItem[];
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sotuvlar', icon: ShoppingCart },
  { href: '/kirim', label: 'Kirim', icon: ArrowDownToLine },
  { href: '/chiqim', label: 'Chiqim', icon: ArrowUpFromLine },
  { href: '/expenses', label: 'Xarajatlar', icon: Receipt },
  {
    href: '/hisobot',
    label: 'Hisobot',
    icon: ClipboardList,
  },
  {
    href: '/users',
    label: 'Foydalanuvchilar',
    icon: Users,
    roles: ['SUPER_ADMIN', 'BOSS'],
  },
  {
    href: '/branches',
    label: 'Filiallar',
    icon: Building2,
    roles: ['SUPER_ADMIN'],
  },
];

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  BOSS: 'Boss',
  EMPLOYEE: 'Xodim',
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filtered = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.roleType ?? ''),
  );

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-white shrink-0">
      {/* App header */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground tracking-tight">
          Ichki siyosat
        </span>
      </div>

      {/* User card */}
      {user && (
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-[#f8f9fa] px-3 py-2.5">
            <Avatar
              name={`${user.firstName} ${user.lastName}`}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[10px] text-muted-foreground leading-tight mt-0.5">
                {roleLabels[user.roleType] ?? user.roleType}
                {user.branch ? ` · ${user.branch.name}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {filtered.map((item) => {
          const Icon = item.icon;
          const isParentActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href ||
                (item.href !== '/' &&
                  pathname.startsWith(item.href) &&
                  !item.sub?.some((s) => pathname.startsWith(s.href)));
          const isSubActive = item.sub?.some((s) => pathname.startsWith(s.href)) ?? false;
          const isExpanded = isParentActive || isSubActive;

          return (
            <div key={item.href}>
              <Link
                href={item.href as never}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                  isParentActive && !isSubActive
                    ? 'bg-primary text-primary-foreground'
                    : isSubActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-[#f0f1f3] hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>

              {item.sub && isExpanded && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {item.sub.map((s) => {
                    const subIsActive = pathname.startsWith(s.href);
                    return (
                      <Link
                        key={s.href}
                        href={s.href as never}
                        className={cn(
                          'block rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                          subIsActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-[#f0f1f3] hover:text-foreground',
                        )}
                      >
                        {s.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border px-3 py-3 space-y-0.5">
        <Link
          href={'/settings' as never}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-[#f0f1f3] hover:text-foreground',
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Sozlamalar</span>
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-[#f0f1f3] hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
