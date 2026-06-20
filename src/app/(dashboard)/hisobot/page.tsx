'use client';

import { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useHisobot } from '@/hooks/use-hisobot';
import { useBranches } from '@/hooks/use-branches';
import { useAuth } from '@/context/auth-context';
import type { CurrencyType, PaymentType, SaleStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

const UZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
function formatUzDate(d: string) {
  const dt = new Date(d);
  return `${dt.getUTCDate()}-${UZ_MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

function StatusBadge({ status, puliOlindi }: { status: SaleStatus; puliOlindi: boolean }) {
  if (status === 'YOPILDI') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Yopildi</Badge>;
  if (status === 'POCHTADA') {
    if (puliOlindi) return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Pochta ✓</Badge>;
    return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Pochtada</Badge>;
  }
  return <Badge variant="outline" className="text-xs">Ochiq</Badge>;
}

function PaymentLabel({ type, receiver }: { type: PaymentType; receiver: string | null }) {
  if (type === 'CASH_UZS') return <span className="text-sm">Naqd UZS</span>;
  if (type === 'CASH_USD') return <span className="text-sm">Naqd USD</span>;
  return <span className="text-sm">Online {receiver ? `(${receiver})` : ''}</span>;
}

function formatAmount(amount: number, currency: CurrencyType) {
  if (currency === 'USD') return `$${amount.toLocaleString('uz-UZ')}`;
  return `${amount.toLocaleString('uz-UZ')} UZS`;
}

export default function HisobotPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';
  const [branchId, setBranchId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { data: branchesData } = useBranches({ pageSize: 100 });
  const branches = branchesData?.items ?? [];

  const { data, isLoading, error } = useHisobot({
    branchId: branchId || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
    pageSize: 200,
  });

  const groups = data?.groups ?? [];
  const total = data?.total ?? 0;

  const grandTotalUzs = groups.reduce((s, g) => s + g.totalUzs, 0);
  const grandTotalUsd = groups.reduce((s, g) => s + g.totalUsd, 0);

  function toggleGroup(date: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hisobot</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Barcha sotuvlar tarixi sanalarga ko&apos;ra</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtr
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {isSuperAdmin && (
              <div className="flex-1 min-w-[160px]">
                <Label>Filial</Label>
                <Select value={branchId} onChange={e => setBranchId(e.target.value)}>
                  <option value="">Barcha filiallar</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </div>
            )}
            <div className="flex-1 min-w-[140px]">
              <Label>Boshlanish sanasi</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label>Tugash sanasi</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <Button
              variant="outline"
              onClick={() => { setBranchId(''); setDateFrom(''); setDateTo(''); }}
            >
              Tozalash
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Jami sotuv</p>
          <p className="text-2xl font-bold mt-1">{total}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Jami (UZS)</p>
          <p className="text-2xl font-bold mt-1">{grandTotalUzs.toLocaleString('uz-UZ')}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Jami (USD)</p>
          <p className="text-2xl font-bold mt-1">${grandTotalUsd.toLocaleString('uz-UZ')}</p>
        </CardContent></Card>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Xatolik: {error instanceof Error ? error.message : "Ma'lumot yuklanmadi"}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-16 text-muted-foreground">Yuklanmoqda...</div>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">Ma&apos;lumot topilmadi</div>
      )}

      {/* Groups by date */}
      <div className="space-y-4">
        {groups.map(group => {
          const collapsed = collapsedGroups.has(group.date);
          return (
            <Card key={group.date} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => toggleGroup(group.date)}
              >
                <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold">{formatUzDate(group.date)}</span>
                    <Badge variant="secondary">{group.count} ta sotuv</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    {group.totalUzs > 0 && (
                      <span className="text-sm font-medium">{group.totalUzs.toLocaleString('uz-UZ')} UZS</span>
                    )}
                    {group.totalUsd > 0 && (
                      <span className="text-sm font-medium">${group.totalUsd.toLocaleString('uz-UZ')}</span>
                    )}
                    {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </button>

              {!collapsed && (
                <div className="border-t">
                  <div className="divide-y">
                    {group.items.map((item, idx) => (
                      <div key={item.id} className="flex items-start justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-muted-foreground mt-0.5 w-5 shrink-0">{idx + 1}.</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{item.productName ?? <span className="text-muted-foreground italic">—</span>}</span>
                              <StatusBadge status={item.status} puliOlindi={item.puliOlindi} />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                              <PaymentLabel type={item.paymentType} receiver={item.onlineReceiver} />
                              {item.quantity != null && <span className="text-xs">• {item.quantity} dona</span>}
                              {isSuperAdmin && <span className="text-xs">• {item.branchName}</span>}
                              {item.notes && <span className="text-xs truncate max-w-[200px]">• {item.notes}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-semibold text-sm">{formatAmount(item.totalAmount, item.currency)}</p>
                          <p className="text-xs text-muted-foreground">{item.createdByName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3 bg-muted/30 flex items-center justify-end gap-6 border-t">
                    {group.totalUzs > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">UZS:</span>{' '}
                        <span className="font-semibold">{group.totalUzs.toLocaleString('uz-UZ')}</span>
                      </div>
                    )}
                    {group.totalUsd > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">USD:</span>{' '}
                        <span className="font-semibold">${group.totalUsd.toLocaleString('uz-UZ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
