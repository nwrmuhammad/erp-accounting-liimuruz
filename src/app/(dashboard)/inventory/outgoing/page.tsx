'use client';

import { useState } from 'react';
import { Plus, Search, PackageMinus } from 'lucide-react';
import { useInventory, useStockSummary, useCreateInventoryMovement } from '@/hooks/use-inventory';
import { useProducts } from '@/hooks/use-products';
import { useBranches } from '@/hooks/use-branches';
import { useAuth } from '@/context/auth-context';
import type { CreateInventoryMovementDto } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const PAGE_SIZE = 20;

const emptyForm = { productId: '', quantity: 1, note: '', branchId: '' };

export default function InventoryOutgoingPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [productFilter, setProductFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useInventory({
    type: 'OUTGOING',
    page,
    pageSize: PAGE_SIZE,
    productId: productFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: productsData } = useProducts({ pageSize: 200 });
  const { data: stockData } = useStockSummary({});
  const { data: branchesData } = useBranches({ pageSize: 100 });
  const branches = branchesData?.items ?? [];
  const createMovement = useCreateInventoryMovement();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const products = productsData?.items ?? [];

  const todayTotal = items
    .filter(m => new Date(m.createdAt).toDateString() === new Date().toDateString())
    .reduce((s, m) => s + m.quantity, 0);

  // Find current stock for selected product in the dialog
  const selectedStock = stockData?.find(s => s.productId === form.productId);

  function openAdd() {
    setForm(emptyForm);
    setFormError('');
    setOpen(true);
  }

  async function save() {
    setFormError('');
    if (isSuperAdmin && !form.branchId) { setFormError("Filial tanlang"); return; }
    if (!form.productId) { setFormError("Mahsulotni tanlang"); return; }
    if (form.quantity < 1) { setFormError("Miqdor kamida 1 bo'lishi kerak"); return; }
    if (selectedStock && form.quantity > selectedStock.currentStock) {
      setFormError(`Stokda faqat ${selectedStock.currentStock} ${selectedStock.unit} mavjud`);
      return;
    }
    try {
      const dto: CreateInventoryMovementDto = {
        productId: form.productId,
        type: 'OUTGOING',
        quantity: Number(form.quantity),
        note: form.note || undefined,
        branchId: isSuperAdmin ? form.branchId : undefined,
      };
      await createMovement.mutateAsync(dto);
      setOpen(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Xato yuz berdi');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chiqim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Inventardan chiqgan mahsulotlar</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />Chiqim qo&apos;shish
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Bugungi chiqim (dona)</p>
            <p className="text-2xl font-bold mt-1 text-red-600">-{todayTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Jami chiqim (joriy sahifa)</p>
            <p className="text-2xl font-bold mt-1">{total} ta harakat</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Select
            value={productFilter}
            onChange={e => { setProductFilter(e.target.value); setPage(1); }}
            className="pl-9 w-full"
          >
            <option value="">Barcha mahsulotlar</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
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
                <TableHead>Mahsulot</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Miqdor</TableHead>
                <TableHead>Izoh</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Kim tomonidan</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <PackageMinus className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    Chiqim topilmadi
                  </TableCell>
                </TableRow>
              ) : items.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.productName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.productSku}</TableCell>
                  <TableCell>
                    <span className="text-red-600 font-semibold">-{m.quantity}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.note ?? '—'}</TableCell>
                  <TableCell className="text-sm">{m.branchName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.createdByName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString('uz-UZ')}
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

      {/* Add Outgoing Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} title="Chiqim qo'shish" className="max-w-md">
        <div className="space-y-4">
          {isSuperAdmin && (
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
            <Label>Mahsulot *</Label>
            <Select
              value={form.productId}
              onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
            >
              <option value="">Mahsulotni tanlang...</option>
              {products.map(p => {
                const stock = stockData?.find(s => s.productId === p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — stok: {stock?.currentStock ?? p.stock} {p.unit}
                  </option>
                );
              })}
            </Select>
          </div>
          {selectedStock && (
            <div className="rounded-md bg-muted p-2 text-sm">
              Mavjud stok: <span className="font-semibold">{selectedStock.currentStock} {selectedStock.unit}</span>
            </div>
          )}
          <div>
            <Label>Miqdor *</Label>
            <Input
              type="number"
              min={1}
              max={selectedStock?.currentStock}
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))}
            />
          </div>
          <div>
            <Label>Izoh</Label>
            <Textarea
              placeholder="Qo'shimcha ma'lumot..."
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={3}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={createMovement.isPending} className="flex-1">
              {createMovement.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
