'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface Product { id: string; name: string; sku: string; unit: string; stock: number }
interface Movement {
  id: string; type: string; quantity: number; note: string | null;
  productName: string; branchName: string; createdAt: string; createdByName: string;
}
interface Paginated<T> { items: T[]; total: number; page: number }

export default function InventoryPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'INCOMING', quantity: 1, note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), pageSize: '20', ...(typeFilter ? { type: typeFilter } : {}) });
    Promise.all([
      api.get<Paginated<Movement>>(`/inventory?${q}`),
      api.get<{ items: Product[] }>('/products?pageSize=200'),
    ]).then(([m, p]) => { setMovements(m.items); setTotal(m.total); setProducts(p.items); })
      .catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, typeFilter]);

  async function addMovement() {
    setSaving(true); setError('');
    try {
      await api.post('/inventory', { ...form, quantity: Number(form.quantity), note: form.note || undefined });
      setOpen(false); setForm({ productId: '', type: 'INCOMING', quantity: 1, note: '' }); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Xato'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventar</h1>
        <Button onClick={() => { setForm({ productId: '', type: 'INCOMING', quantity: 1, note: '' }); setError(''); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Harakat qo'shish
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="w-44">
          <option value="">Barcha harakat</option>
          <option value="INCOMING">Kirim</option>
          <option value="OUTGOING">Chiqim</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tur</TableHead>
                <TableHead>Mahsulot</TableHead>
                <TableHead>Miqdor</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Kim tomonidan</TableHead>
                <TableHead>Izoh</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
              ) : movements.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Harakat topilmadi</TableCell></TableRow>
              ) : movements.map(m => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.type === 'INCOMING' ? (
                      <Badge variant="success"><ArrowUpCircle className="mr-1 h-3 w-3" />Kirim</Badge>
                    ) : (
                      <Badge variant="destructive"><ArrowDownCircle className="mr-1 h-3 w-3" />Chiqim</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{m.productName}</TableCell>
                  <TableCell className={`font-semibold ${m.type === 'INCOMING' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'INCOMING' ? '+' : '-'}{m.quantity}
                  </TableCell>
                  <TableCell>{m.branchName}</TableCell>
                  <TableCell className="text-muted-foreground">{m.createdByName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.note ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(m.createdAt).toLocaleDateString('uz-UZ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Jami: {total} ta</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Oldingi</Button>
            <span className="flex items-center px-2">Sahifa {page}</span>
            <Button size="sm" variant="outline" disabled={movements.length < 20} onClick={() => setPage(p => p + 1)}>Keyingi</Button>
          </div>
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Inventar harakati">
        <div className="space-y-3">
          <div><Label>Mahsulot</Label>
            <Select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
              <option value="">Tanlang...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (stok: {p.stock} {p.unit})</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Harakat turi</Label>
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="INCOMING">Kirim (+)</option>
                <option value="OUTGOING">Chiqim (-)</option>
              </Select>
            </div>
            <div><Label>Miqdor</Label>
              <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} />
            </div>
          </div>
          <div><Label>Izoh (ixtiyoriy)</Label>
            <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} placeholder="Izoh..." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button onClick={addMovement} disabled={saving || !form.productId} className="flex-1">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
