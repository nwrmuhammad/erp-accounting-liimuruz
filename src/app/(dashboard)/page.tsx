'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import {
  TrendingUp, DollarSign, CreditCard, AlertCircle,
  ShoppingCart, Package, Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useAnalytics } from '@/hooks/use-analytics';
import { useBranches } from '@/hooks/use-branches';
import { useSales } from '@/hooks/use-sales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { PaymentType } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUzs(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + ' UZS';
}

function formatShort(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(Math.round(n));
}

function getDateRange(period: 'today' | 'week' | 'month') {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (period === 'today') return { dateFrom: to, dateTo: to };
  if (period === 'week') {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold text-foreground truncate">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ml-3 shrink-0 ${colorMap[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl ml-3" />
        </div>
      </CardContent>
    </Card>
  );
}

const PAYMENT_BADGE: Record<PaymentType, { label: string; variant: 'success' | 'default' | 'secondary' }> = {
  CASH_UZS: { label: 'Naqd UZS', variant: 'success' },
  CASH_USD: { label: 'Naqd USD', variant: 'default' },
  ONLINE: { label: 'Online', variant: 'secondary' },
};

// ─── Branch Dashboard (EMPLOYEE / BOSS) ───────────────────────────────────────

function BranchDashboard({ branchId }: { branchId: string }) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const { dateFrom, dateTo } = getDateRange(period);

  const { data: analytics, isLoading, error } = useAnalytics({ branchId, dateFrom, dateTo });
  const { data: recentSalesData, isLoading: salesLoading } = useSales({ pageSize: 5, page: 1 });

  const recentSales = recentSalesData?.items ?? [];

  const periodLabel = { today: 'Bugun', week: 'Oxirgi 7 kun', month: 'Bu oy' };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Ma'lumotlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  const sales = analytics?.sales;
  const inventoryTrends = analytics?.inventoryTrends ?? [];
  const expenseTrends = analytics?.expenseTrends ?? [];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dateFrom} — {dateTo}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Main stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Jami sotuv"
              value={formatUzs(sales?.totalSales ?? 0)}
              subtitle={`${sales?.salesCount ?? 0} ta sotuv`}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              title="Sotuvlar soni"
              value={String(sales?.salesCount ?? 0)}
              subtitle={periodLabel[period]}
              icon={ShoppingCart}
              color="green"
            />
            <StatCard
              title="Jami xarajat (UZS)"
              value={formatUzs(expenseTrends.reduce((s, e) => s + e.totalUzs, 0))}
              subtitle={`${expenseTrends.reduce((s, e) => s + e.count, 0)} ta xarajat`}
              icon={Wallet}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Row 2: Payment breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Naqd (UZS)"
              value={formatUzs(sales?.totalCashUzs ?? 0)}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Naqd (USD)"
              value={`$${formatShort(sales?.totalCashUsd ?? 0)}`}
              icon={DollarSign}
              color="blue"
            />
            <StatCard
              title="Online to'lovlar"
              value={formatUzs(sales?.totalOnline ?? 0)}
              subtitle={`Ali: ${formatShort(sales?.totalAli ?? 0)} | Bilol: ${formatShort(sales?.totalBilol ?? 0)}`}
              icon={CreditCard}
              color="purple"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Inventory trends bar chart */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Inventar harakati</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : inventoryTrends.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Ma'lumot yo'q
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={inventoryTrends.slice(-7)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="incoming" name="Kirim" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="outgoing" name="Chiqim" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Recent Sales */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">So'nggi sotuvlar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {salesLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Sotuvlar yo'q
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Sotuv #</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Summa</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">To'lov</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Sana</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => {
                  const pm = PAYMENT_BADGE[s.paymentType] ?? { label: s.paymentType, variant: 'secondary' as const };
                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-medium">{s.saleNumber}</td>
                      <td className="p-3 font-semibold">{formatUzs(s.totalAmount)}</td>
                      <td className="p-3">
                        <Badge variant={pm.variant}>{pm.label}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Super Admin Dashboard ─────────────────────────────────────────────────────

function SuperAdminDashboard() {
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const { dateFrom, dateTo } = getDateRange(period);

  const { data: branchesData } = useBranches({ pageSize: 100 });
  const branches = branchesData?.items ?? [];

  const { data: analytics, isLoading, error } = useAnalytics({
    branchId: selectedBranchId || undefined,
    dateFrom,
    dateTo,
  });

  const periodLabel = { today: 'Bugun', week: 'Oxirgi 7 kun', month: 'Bu oy' };

  const sales = analytics?.sales;
  const inventoryTrends = analytics?.inventoryTrends ?? [];
  const expenseTrends = analytics?.expenseTrends ?? [];

  const totalExpenseUzs = expenseTrends.reduce((s, e) => s + e.totalUzs, 0);
  const netProfit = (sales?.totalSales ?? 0) - totalExpenseUzs;

  const paymentPieData = [
    { name: 'Naqd UZS', value: sales?.totalCashUzs ?? 0 },
    { name: 'Naqd USD', value: (sales?.totalCashUsd ?? 0) * 12500 },
    { name: 'Online', value: sales?.totalOnline ?? 0 },
  ].filter((d) => d.value > 0);


  // Use inventory trends as a proxy for sales trend over time
  const salesTrendData = inventoryTrends.map((t) => ({
    date: t.date,
    incoming: t.incoming,
    outgoing: t.outgoing,
    net: t.net,
  }));

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Ma'lumotlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dateFrom} — {dateTo}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-48"
          >
            <option value="">Barcha filiallar</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {periodLabel[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Jami daromad"
              value={formatUzs(sales?.totalSales ?? 0)}
              subtitle={`${sales?.salesCount ?? 0} ta sotuv`}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              title="Jami xarajat"
              value={formatUzs(totalExpenseUzs)}
              subtitle={`${expenseTrends.reduce((s, e) => s + e.count, 0)} ta`}
              icon={Wallet}
              color="orange"
            />
            <StatCard
              title="Sof foyda"
              value={formatUzs(netProfit)}
              subtitle={netProfit >= 0 ? 'Ijobiy' : 'Manfiy'}
              icon={DollarSign}
              color={netProfit >= 0 ? 'green' : 'red'}
            />
          </>
        )}
      </div>

      {/* Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Naqd (UZS)"
              value={formatUzs(sales?.totalCashUzs ?? 0)}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Online to'lovlar"
              value={formatUzs(sales?.totalOnline ?? 0)}
              subtitle={`Ali: ${formatShort(sales?.totalAli ?? 0)} | Bilol: ${formatShort(sales?.totalBilol ?? 0)}`}
              icon={CreditCard}
              color="purple"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales / inventory trend - Area chart */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Inventar tendensiyasi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : salesTrendData.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Ma'lumot yo'q
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={salesTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="incoming" name="Kirim" stroke="#10b981" fill="url(#colorIncoming)" strokeWidth={2} />
                  <Area type="monotone" dataKey="outgoing" name="Chiqim" stroke="#ef4444" fill="url(#colorOutgoing)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Payment type pie */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">To'lov turlari bo'yicha</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : paymentPieData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              Sotuv yo'q
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={paymentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {paymentPieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatUzs(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  if (user?.roleType === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  }

  return <BranchDashboard branchId={user?.branch?.id ?? ''} />;
}
