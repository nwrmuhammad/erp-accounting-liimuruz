'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowUpFromLine } from 'lucide-react';
import { useChiqimList, useCreateChiqim, useUpdateChiqim, useDeleteChiqim, type ChiqimItem } from '@/hooks/use-chiqim';
import { useBranches } from '@/hooks/use-branches';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

const PAGE_SIZE = 20;
const UZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];

function formatUzDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}-${UZ_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

type ChiqimForm = {
  productName: string;
  recipient: string;
  responsible: string;
  chiqimDate: string;
  notes: string;
  branchId: string;
};

const emptyForm: ChiqimForm = {
  productName: '', recipient: '', responsible: '',
  chiqimDate: todayStr(), notes: '', branchId: '',
};

function itemToForm(c: ChiqimItem): ChiqimForm {
  return {
    productName: c.productName ?? '',
    recipient: c.recipient,
    responsible: c.responsible,
    chiqimDate: c.chiqimDate.slice(0, 10),
    notes: c.notes ?? '',
    branchId: c.branch.id,
  };
}

export default function ChiqimPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChiqimForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useChiqimList({
    page, pageSize: PAGE_SIZE,
    search: search || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
  });

  const { data: branchesData } = useBranches({ pageSize: 100 }, { enabled: isSuperAdmin });
  const branches = branchesData?.items ?? [];
  const create = useCreateChiqim();
  const update = useUpdateChiqim();
  const remove = useDeleteChiqim();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openCreate() { setEditingId(null); setForm(emptyForm); setFormError(''); setOpen(true); }
  function openEdit(c: ChiqimItem) { setEditingId(c.id); setForm(itemToForm(c)); setFormError(''); setOpen(true); }

  async function save() {
    setFormError('');
    if (isSuperAdmin && !form.branchId) { setFormError('Filial tanlang'); return; }
    if (!form.recipient.trim()) { setFormError('Kimga berib yuborilgani kiritilmagan'); return; }
    if (!form.responsible.trim()) { setFormError('Javobgar kimligi kiritilmagan'); return; }

    const dto = {
      productName: form.productName.trim() || undefined,
      recipient: form.recipient.trim(),
      responsible: form.responsible.trim(),
      chiqimDate: form.chiqimDate ? new Date(form.chiqimDate).toISOString() : undefined,
      notes: form.notes.trim() || undefined,
      branchId: isSuperAdmin ? form.branchId : undefined,
    };

    try {
      if (editingId) { await update.mutateAsync({ id: editingId, dto }); }
      else { await create.mutateAsync(dto); }
      setOpen(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Xato yuz berdi');
    }
  }

  async function del(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await remove.mutateAsync(id).catch(console.error);
  }

  const colSpan = isSuperAdmin ? 6 : 5;
  const isPending = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold tracking-tight">Chiqim</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Berib yuborilgan narsalar ro&apos;yxati</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Yangi chiqim
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Mahsulot, qabul qiluvchi yoki javobgar bo'yicha..."
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahsulot nomi</TableHead>
                <TableHead>Kimga berildi</TableHead>
                <TableHead>Javobgar</TableHead>
                <TableHead>Sana</TableHead>
                {isSuperAdmin && <TableHead>Filial</TableHead>}
                <TableHead className="w-[90px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">Chiqim topilmadi</TableCell></TableRow>
              ) : items.map((c: ChiqimItem) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.productName ?? <span className="text-muted-foreground italic">—</span>}</p>
                    {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                  </TableCell>
                  <TableCell className="font-medium">{c.recipient}</TableCell>
                  <TableCell className="text-sm">{c.responsible}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatUzDate(c.chiqimDate)}</TableCell>
                  {isSuperAdmin && <TableCell className="text-sm">{c.branch.name}</TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Jami: {total} ta yozuv</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Oldingi</Button>
            <span className="px-2">Sahifa {page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Keyingi</Button>
          </div>
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editingId ? 'Chiqimni tahrirlash' : "Yangi chiqim qo'shish"} className="max-w-md">
        <div className="space-y-4">
          {isSuperAdmin && (
            <div>
              <Label>Filial *</Label>
              <Select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}>
                <option value="">Filial tanlang...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
          )}
          <div>
            <Label>Mahsulot nomi (ixtiyoriy)</Label>
            <Input
              placeholder="Masalan: Noutbuk, Stol, Qog'oz..."
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Kimga berib yuborildi *</Label>
            <Input
              placeholder="Qabul qiluvchi ismi yoki tashkilot..."
              value={form.recipient}
              onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
            />
          </div>
          <div>
            <Label>Javobgar *</Label>
            <Input
              placeholder="Javobgar xodim ismi..."
              value={form.responsible}
              onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
            />
          </div>
          <div>
            <Label>Sana</Label>
            <Input
              type="date" value={form.chiqimDate}
              onChange={e => setForm(f => ({ ...f, chiqimDate: e.target.value }))}
            />
          </div>
          <div>
            <Label>Izoh (ixtiyoriy)</Label>
            <Textarea
              placeholder="Qo'shimcha ma'lumot..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={isPending} className="flex-1">
              {isPending ? 'Saqlanmoqda...' : (editingId ? 'Saqlash' : "Qo'shish")}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
