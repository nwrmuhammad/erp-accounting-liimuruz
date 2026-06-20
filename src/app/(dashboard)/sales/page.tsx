'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Trash2, Pencil, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useSales, useCreateSale, useUpdateSale, useDeleteSale } from '@/hooks/use-sales';
import { useBranches } from '@/hooks/use-branches';
import { useAuth } from '@/context/auth-context';
import type { Sale, CreateSaleDto, PaymentType, OnlineReceiver, CurrencyType, SaleStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

const PAGE_SIZE = 50;

const UZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
function formatUzDate(d: string) {
  const dt = new Date(d);
  return `${dt.getUTCDate()}-${UZ_MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}
function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const PAYMENT_LABELS: Record<PaymentType, string> = {
  CASH_UZS: 'Naqd (UZS)', CASH_USD: 'Naqd (USD)', ONLINE: 'Online',
};
const CURRENCY_BY_PAYMENT: Record<PaymentType, CurrencyType> = {
  CASH_UZS: 'UZS', CASH_USD: 'USD', ONLINE: 'UZS',
};

function PaymentBadge({ type }: { type: PaymentType }) {
  if (type === 'CASH_UZS') return <Badge variant="secondary">Naqd UZS</Badge>;
  if (type === 'CASH_USD') return <Badge variant="outline">Naqd USD</Badge>;
  return <Badge variant="default">Online</Badge>;
}

function formatAmount(amount: number, currency: CurrencyType) {
  if (currency === 'USD') return `$${amount.toLocaleString('uz-UZ')}`;
  return `${amount.toLocaleString('uz-UZ')} UZS`;
}

// ─── Status dropdown ────────────────────────────────────────────────────────

interface StatusDropdownProps {
  sale: Sale;
  onSetStatus: (id: string, status: SaleStatus) => void;
  onTogglePuliOlindi: (sale: Sale) => void;
}

function StatusDropdown({ sale, onSetStatus, onTogglePuliOlindi }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      zIndex: 9999,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const { status, puliOlindi } = sale;

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="min-w-[160px] rounded-lg border border-border bg-white shadow-xl py-1"
    >
      {/* Yopildi */}
      {status !== 'YOPILDI' && (
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 text-green-700 transition-colors"
          onMouseDown={e => e.preventDefault()}
          onClick={() => { onSetStatus(sale.id, 'YOPILDI'); setOpen(false); }}
        >
          <CheckCircle2 className="h-4 w-4" />
          Yopildi
        </button>
      )}

      {/* Pochtada */}
      {status === 'OCHIQ' && (
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-orange-50 text-orange-600 transition-colors"
          onMouseDown={e => e.preventDefault()}
          onClick={() => { onSetStatus(sale.id, 'POCHTADA'); setOpen(false); }}
        >
          <span className="h-4 w-4 flex items-center justify-center text-base leading-none">✉</span>
          Pochtada
        </button>
      )}

      {/* Pochtada — pul olindi tick */}
      {status === 'POCHTADA' && (
        <button
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${puliOlindi ? 'text-blue-600 hover:bg-blue-50' : 'text-muted-foreground hover:bg-blue-50 hover:text-blue-600'}`}
          onMouseDown={e => e.preventDefault()}
          onClick={() => { onTogglePuliOlindi(sale); setOpen(false); }}
        >
          <CheckCircle2 className="h-4 w-4" />
          {puliOlindi ? 'Pul olindi ✓' : 'Pul olindi'}
        </button>
      )}

      {/* Yopildi holatini bekor qilish — Pochtada uchun */}
      {status === 'YOPILDI' && (
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/40 text-muted-foreground transition-colors"
          onMouseDown={e => e.preventDefault()}
          onClick={() => { onSetStatus(sale.id, 'OCHIQ'); setOpen(false); }}
        >
          Bekor qilish
        </button>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-muted/40 transition-colors"
      >
        {status === 'YOPILDI' && (
          <span className="flex items-center gap-1 text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Yopildi
          </span>
        )}
        {status === 'POCHTADA' && (
          <span className="flex items-center gap-1 text-orange-600">
            Pochtada{puliOlindi && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 ml-0.5" />}
          </span>
        )}
        {status === 'OCHIQ' && (
          <span className="text-muted-foreground">Status</span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
      </button>
      {menu}
    </div>
  );
}

// ─── Form ───────────────────────────────────────────────────────────────────

type SaleForm = {
  productName: string; quantity: string; totalAmount: string;
  currency: CurrencyType; paymentType: PaymentType;
  onlineReceiver: OnlineReceiver | ''; saleDate: string; notes: string; branchId: string;
  status: SaleStatus;
};
const emptyForm: SaleForm = {
  productName: '', quantity: '', totalAmount: '', currency: 'UZS',
  paymentType: 'CASH_UZS', onlineReceiver: '', saleDate: todayInputValue(), notes: '', branchId: '',
  status: 'OCHIQ',
};
function saleToForm(s: Sale): SaleForm {
  return {
    productName: s.productName ?? '', quantity: s.quantity != null ? String(s.quantity) : '',
    totalAmount: String(s.totalAmount), currency: s.currency, paymentType: s.paymentType,
    onlineReceiver: (s.onlineReceiver ?? '') as OnlineReceiver | '',
    saleDate: s.saleDate.slice(0, 10), notes: s.notes ?? '', branchId: s.branchId,
    status: s.status,
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SaleForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useSales({ page, pageSize: PAGE_SIZE, search: search || undefined, mode: 'active' });
  const { data: branchesData } = useBranches({ pageSize: 100 }, { enabled: isSuperAdmin });
  const branches = branchesData?.items ?? [];
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();
  const deleteSale = useDeleteSale();

  const items = (data?.items ?? []) as Sale[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const totalUzs = items.filter(s => s.currency === 'UZS').reduce((s, e) => s + e.totalAmount, 0);
  const totalUsd = items.filter(s => s.currency === 'USD').reduce((s, e) => s + e.totalAmount, 0);

  function openCreate() { setEditingId(null); setForm(emptyForm); setFormError(''); setOpen(true); }
  function openEdit(s: Sale) { setEditingId(s.id); setForm(saleToForm(s)); setFormError(''); setOpen(true); }

  async function setStatus(id: string, status: SaleStatus) {
    await updateSale.mutateAsync({ id, dto: { status } }).catch(console.error);
  }
  async function togglePuliOlindi(s: Sale) {
    await updateSale.mutateAsync({ id: s.id, dto: { puliOlindi: !s.puliOlindi } }).catch(console.error);
  }

  function validate() {
    if (isSuperAdmin && !form.branchId) return 'Filial tanlang';
    const a = Number(form.totalAmount);
    if (!form.totalAmount || isNaN(a) || a <= 0) return "Summa 0 dan katta bo'lishi kerak";
    if (form.quantity && (isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)) return "Soni musbat son bo'lishi kerak";
    if (form.paymentType === 'ONLINE' && !form.onlineReceiver) return "Online to'lov uchun qabul qiluvchini tanlang";
    return null;
  }

  async function save() {
    setFormError('');
    const err = validate();
    if (err) { setFormError(err); return; }
    const dto: CreateSaleDto = {
      productName: form.productName.trim() || undefined,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      totalAmount: Number(form.totalAmount),
      currency: form.currency, paymentType: form.paymentType,
      onlineReceiver: form.paymentType === 'ONLINE' && form.onlineReceiver ? (form.onlineReceiver as OnlineReceiver) : undefined,
      saleDate: form.saleDate ? (form.saleDate + 'T00:00:00.000Z') : undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      branchId: isSuperAdmin ? form.branchId : undefined,
    };
    try {
      if (editingId) await updateSale.mutateAsync({ id: editingId, dto });
      else await createSale.mutateAsync(dto);
      setOpen(false);
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : 'Xato yuz berdi'); }
  }

  async function remove(id: string) {
    if (!confirm("Sotuvni o'chirishni tasdiqlaysizmi?")) return;
    await deleteSale.mutateAsync(id).catch(console.error);
  }

  const colSpan = isSuperAdmin ? 8 : 7;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sotuvlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bugungi sotuvlar va kutilayotgan pochtalar</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Yangi sotuv</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Jami (UZS)</p>
          <p className="text-2xl font-bold mt-1">{totalUzs.toLocaleString('uz-UZ')} UZS</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Jami (USD)</p>
          <p className="text-2xl font-bold mt-1">${totalUsd.toLocaleString('uz-UZ')}</p>
        </CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Mahsulot nomi yoki izoh bo'yicha qidiring..."
          className="pl-9"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
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
                <TableHead>Mahsulot</TableHead>
                <TableHead>Soni</TableHead>
                <TableHead>Summa</TableHead>
                <TableHead>To&apos;lov</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Status</TableHead>
                {isSuperAdmin && <TableHead>Filial</TableHead>}
                <TableHead className="w-[80px]">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">Bugungi sotuv yo&apos;q</TableCell></TableRow>
              ) : items.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-medium">{s.productName ?? <span className="text-muted-foreground italic">—</span>}</p>
                    {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                  </TableCell>
                  <TableCell>{s.quantity ?? '—'}</TableCell>
                  <TableCell className="font-semibold">{formatAmount(s.totalAmount, s.currency)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <PaymentBadge type={s.paymentType} />
                      {s.onlineReceiver && <span className="text-xs text-muted-foreground">{s.onlineReceiver}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatUzDate(s.saleDate)}</TableCell>
                  <TableCell>
                    <StatusDropdown
                      sale={s}
                      onSetStatus={setStatus}
                      onTogglePuliOlindi={togglePuliOlindi}
                    />
                  </TableCell>
                  {isSuperAdmin && <TableCell className="text-sm">{s.branchName}</TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
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

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Jami: {total} ta</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Oldingi</Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Keyingi</Button>
          </div>
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editingId ? "Sotuvni tahrirlash" : "Yangi sotuv qo'shish"} className="max-w-md">
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
            <Input placeholder="Masalan: Kiyim, Non..." value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Soni (ixtiyoriy)</Label>
              <Input type="number" min={1} placeholder="1" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <Label>Sotilgan sana</Label>
              <Input type="date" value={form.saleDate}
                onChange={e => setForm(f => ({ ...f, saleDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>To&apos;lov turi *</Label>
            <Select value={form.paymentType} onChange={e => {
              const pt = e.target.value as PaymentType;
              setForm(f => ({ ...f, paymentType: pt, currency: CURRENCY_BY_PAYMENT[pt], onlineReceiver: '' }));
            }}>
              {(Object.entries(PAYMENT_LABELS) as [PaymentType, string][]).map(([v, l]) =>
                <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          {form.paymentType === 'ONLINE' && (
            <div>
              <Label>Qabul qiluvchi *</Label>
              <Select value={form.onlineReceiver}
                onChange={e => setForm(f => ({ ...f, onlineReceiver: e.target.value as OnlineReceiver | '' }))}>
                <option value="">Tanlang</option>
                <option value="ALI">Ali</option>
                <option value="BILOL">Bilol</option>
                <option value="JAMOL">Jamol</option>
                <option value="ABDULBOSIT">Abdulbosit</option>
              </Select>
            </div>
          )}
          <div>
            <Label>Summa ({form.currency}) *</Label>
            <Input type="number" min={0} step={form.currency === 'USD' ? '0.01' : '1'}
              placeholder={form.currency === 'USD' ? '0.00' : '0'} value={form.totalAmount}
              onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SaleStatus }))}>
              <option value="OCHIQ">Ochiq</option>
              <option value="POCHTADA">Pochtada</option>
              <option value="YOPILDI">Yopildi</option>
            </Select>
          </div>
          <div>
            <Label>Izoh (ixtiyoriy)</Label>
            <Textarea placeholder="Qo'shimcha ma'lumot..." value={form.notes} rows={2}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={createSale.isPending || updateSale.isPending} className="flex-1">
              {(createSale.isPending || updateSale.isPending) ? 'Saqlanmoqda...' : (editingId ? 'Saqlash' : "Qo'shish")}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
