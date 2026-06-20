'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowDownToLine } from 'lucide-react';
import { useKirimList, useCreateKirim, useUpdateKirim, useDeleteKirim, type KirimItem } from '@/hooks/use-kirim';
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

type KirimForm = { productName: string; quantity: string; kirimDate: string; notes: string; branchId: string };
const emptyForm: KirimForm = { productName: '', quantity: '', kirimDate: todayStr(), notes: '', branchId: '' };

function itemToForm(k: KirimItem): KirimForm {
  return {
    productName: k.productName ?? '',
    quantity: String(k.quantity),
    kirimDate: k.kirimDate.slice(0, 10),
    notes: k.notes ?? '',
    branchId: k.branch.id,
  };
}

export default function KirimPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KirimForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useKirimList({
    page, pageSize: PAGE_SIZE,
    search: search || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
  });

  const { data: branchesData } = useBranches({ pageSize: 100 }, { enabled: isSuperAdmin });
  const branches = branchesData?.items ?? [];
  const create = useCreateKirim();
  const update = useUpdateKirim();
  const remove = useDeleteKirim();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalQty = items.reduce((s, k) => s + k.quantity, 0);

  function openCreate() { setEditingId(null); setForm(emptyForm); setFormError(''); setOpen(true); }
  function openEdit(k: KirimItem) { setEditingId(k.id); setForm(itemToForm(k)); setFormError(''); setOpen(true); }

  async function save() {
    setFormError('');
    if (isSuperAdmin && !form.branchId) { setFormError('Filial tanlang'); return; }
    const qty = Number(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0) { setFormError("Soni musbat son bo'lishi kerak"); return; }

    const dto = {
      productName: form.productName.trim() || undefined,
      quantity: qty,
      kirimDate: form.kirimDate ? new Date(form.kirimDate).toISOString() : undefined,
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
            <ArrowDownToLine className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold tracking-tight">Kirim</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Kelgan narsalar ro'yxati</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Yangi kirim
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Jami soni — joriy sahifa</p>
          <p className="text-2xl font-bold mt-1">{totalQty.toLocaleString('uz-UZ')} dona</p>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Mahsulot nomi bo'yicha qidiring..."
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
                <TableHead>Soni</TableHead>
                <TableHead>Sana</TableHead>
                {isSuperAdmin && <TableHead>Filial</TableHead>}
                <TableHead>Kim kiritdi</TableHead>
                <TableHead className="w-[90px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">Kirim topilmadi</TableCell></TableRow>
              ) : items.map((k: KirimItem) => (
                <TableRow key={k.id}>
                  <TableCell>
                    <p className="font-medium">{k.productName ?? <span className="text-muted-foreground italic">—</span>}</p>
                    {k.notes && <p className="text-xs text-muted-foreground">{k.notes}</p>}
                  </TableCell>
                  <TableCell className="font-semibold">{k.quantity.toLocaleString('uz-UZ')}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatUzDate(k.kirimDate)}</TableCell>
                  {isSuperAdmin && <TableCell className="text-sm">{k.branch.name}</TableCell>}
                  <TableCell className="text-sm text-muted-foreground">{k.createdBy.firstName} {k.createdBy.lastName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(k)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => del(k.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      <Dialog open={open} onClose={() => setOpen(false)} title={editingId ? 'Kirimni tahrirlash' : "Yangi kirim qo'shish"} className="max-w-md">
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
              placeholder="Masalan: Kreslolar, Daftar, Printer..."
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Soni *</Label>
              <Input
                type="number" min={1} placeholder="1"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div>
              <Label>Sana</Label>
              <Input
                type="date" value={form.kirimDate}
                onChange={e => setForm(f => ({ ...f, kirimDate: e.target.value }))}
              />
            </div>
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
