'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses';
import { useBranches } from '@/hooks/use-branches';
import { useAuth } from '@/context/auth-context';
import type { Expense, CreateExpenseDto, PaymentType, OnlineReceiver, CurrencyType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const PAGE_SIZE = 20;

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type ExpenseForm = {
  description: string;
  amount: string;
  currency: CurrencyType;
  paymentType: PaymentType;
  onlineReceiver: OnlineReceiver | '';
  expenseDate: string;
  notes: string;
  branchId: string;
};

const emptyForm: ExpenseForm = {
  description: '',
  amount: '',
  currency: 'UZS',
  paymentType: 'CASH_UZS',
  onlineReceiver: '',
  expenseDate: todayInputValue(),
  notes: '',
  branchId: '',
};

const PAYMENT_LABELS: Record<PaymentType, string> = {
  CASH_UZS: 'Naqd (UZS)',
  CASH_USD: 'Naqd (USD)',
  ONLINE: 'Online',
};

const CURRENCY_BY_PAYMENT: Record<PaymentType, CurrencyType> = {
  CASH_UZS: 'UZS',
  CASH_USD: 'USD',
  ONLINE: 'UZS',
};

function paymentBadge(type: PaymentType) {
  if (type === 'CASH_UZS') return <Badge variant="secondary">Naqd UZS</Badge>;
  if (type === 'CASH_USD') return <Badge variant="outline">Naqd USD</Badge>;
  return <Badge variant="default">Online</Badge>;
}

function formatAmount(amount: number, currency: CurrencyType) {
  if (currency === 'USD') return `$${amount.toLocaleString('uz-UZ')}`;
  return `${amount.toLocaleString('uz-UZ')} UZS`;
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useExpenses({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
  });

  const { data: branchesData } = useBranches({ pageSize: 100 }, { enabled: isSuperAdmin });
  const branches = branchesData?.items ?? [];
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense(editingExpense?.id ?? '');
  const deleteExpense = useDeleteExpense();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const totalUzs = items.filter(e => e.currency === 'UZS').reduce((s, e) => s + e.amount, 0);
  const totalUsd = items.filter(e => e.currency === 'USD').reduce((s, e) => s + e.amount, 0);

  function openCreate() {
    setEditingExpense(null);
    setForm({ ...emptyForm, expenseDate: todayInputValue() });
    setFormError('');
    setOpen(true);
  }

  function openEdit(e: Expense) {
    setEditingExpense(e);
    setForm({
      description: e.description,
      amount: String(e.amount),
      currency: e.currency,
      paymentType: e.paymentType,
      onlineReceiver: e.onlineReceiver ?? '',
      expenseDate: e.expenseDate ? e.expenseDate.slice(0, 10) : todayInputValue(),
      notes: e.notes ?? '',
      branchId: '',
    });
    setFormError('');
    setOpen(true);
  }

  async function save() {
    setFormError('');
    if (!form.description.trim()) { setFormError("Tavsifni kiriting"); return; }
    if (isSuperAdmin && !editingExpense && !form.branchId) { setFormError("Filial tanlang"); return; }
    const amount = Number(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) { setFormError("Summa 0 dan katta bo'lishi kerak"); return; }
    if (form.paymentType === 'ONLINE' && !form.onlineReceiver) { setFormError("Online to'lov uchun qabul qiluvchini tanlang"); return; }
    try {
      const dto: CreateExpenseDto = {
        description: form.description.trim(),
        amount,
        currency: form.currency,
        paymentType: form.paymentType,
        onlineReceiver: form.paymentType === 'ONLINE' && form.onlineReceiver
          ? (form.onlineReceiver as OnlineReceiver)
          : undefined,
        notes: form.notes.trim() || undefined,
        expenseDate: form.expenseDate ? (form.expenseDate + 'T00:00:00.000Z') : undefined,
        branchId: isSuperAdmin && !editingExpense ? form.branchId : undefined,
      };
      if (editingExpense) {
        await updateExpense.mutateAsync(dto);
      } else {
        await createExpense.mutateAsync(dto);
      }
      setOpen(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Xato yuz berdi');
    }
  }

  async function remove(id: string) {
    if (!confirm("Xarajatni o'chirishni tasdiqlaysizmi?")) return;
    await deleteExpense.mutateAsync(id).catch(console.error);
  }

  const isSaving = createExpense.isPending || updateExpense.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Xarajatlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Barcha xarajatlarni kuzating</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Yangi xarajat
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Jami (UZS) — joriy sahifa</p>
            <p className="text-2xl font-bold mt-1">{totalUzs.toLocaleString('uz-UZ')} UZS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Jami (USD) — joriy sahifa</p>
            <p className="text-2xl font-bold mt-1">${totalUsd.toLocaleString('uz-UZ')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tavsif bo'yicha qidirish..."
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-40" />
        <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-40" />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Xatolik: {error instanceof Error ? error.message : "Ma'lumot yuklanmadi"}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tavsif</TableHead>
                <TableHead>Summa</TableHead>
                <TableHead>To&apos;lov turi</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Xarajat topilmadi
                  </TableCell>
                </TableRow>
              ) : items.map(e => (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="font-medium">{e.description}</p>
                    {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                  </TableCell>
                  <TableCell className="font-semibold">{formatAmount(e.amount, e.currency)}</TableCell>
                  <TableCell>
                    {paymentBadge(e.paymentType)}
                    {e.onlineReceiver && <span className="ml-1 text-xs text-muted-foreground">{e.onlineReceiver}</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(e.expenseDate).toLocaleDateString('uz-UZ')}
                  </TableCell>
                  <TableCell className="text-sm">{e.branchName}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Jami: {total} ta</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Oldingi</Button>
            <span className="px-2">Sahifa {page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Keyingi</Button>
          </div>
        </div>
      )}

      {/* Create / Edit Expense Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} title={editingExpense ? 'Xarajatni tahrirlash' : 'Yangi xarajat'} className="max-w-lg">
        <div className="space-y-4">
          {isSuperAdmin && !editingExpense && (
            <div>
              <Label>Filial *</Label>
              <Select
                value={form.branchId}
                onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
              >
                <option value="">Filial tanlang...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
          )}
          <div>
            <Label>Tavsif *</Label>
            <Input
              placeholder="Xarajat tavsifi"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>To&apos;lov turi *</Label>
              <Select
                value={form.paymentType}
                onChange={e => {
                  const pt = e.target.value as PaymentType;
                  setForm(f => ({
                    ...f,
                    paymentType: pt,
                    currency: CURRENCY_BY_PAYMENT[pt],
                    onlineReceiver: '',
                  }));
                }}
              >
                {(Object.entries(PAYMENT_LABELS) as [PaymentType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>
            {form.paymentType === 'ONLINE' && (
              <div>
                <Label>Qabul qiluvchi *</Label>
                <Select
                  value={form.onlineReceiver}
                  onChange={e => setForm(f => ({ ...f, onlineReceiver: e.target.value as OnlineReceiver | '' }))}
                >
                  <option value="">Tanlang</option>
                  <option value="ALI">Ali</option>
                  <option value="BILOL">Bilol</option>
                  <option value="JAMOL">Jamol</option>
                  <option value="ABDULBOSIT">Abdulbosit</option>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label>Summa ({form.currency}) *</Label>
            <Input
              type="number"
              min={0}
              step={form.currency === 'USD' ? '0.01' : '1'}
              placeholder={form.currency === 'USD' ? '0.00' : '0'}
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <Label>Xarajat sanasi</Label>
            <Input
              type="date"
              value={form.expenseDate}
              onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
            />
          </div>
          <div>
            <Label>Izoh</Label>
            <Textarea
              placeholder="Qo'shimcha ma'lumot..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={isSaving} className="flex-1">
              {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
