'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Tag, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  useProducts,
  useProductCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/use-products';
import { useBranches } from '@/hooks/use-branches';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { Product, CreateProductDto } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + ' UZS';
}

const UNITS = ['dona', 'kg', 'litr', 'metr', 'quti'];

const emptyForm: CreateProductDto & { categoryId: string; branchId: string } = {
  name: '',
  sku: '',
  unit: 'dona',
  costPrice: 0,
  sellingPrice: 0,
  stock: 0,
  categoryId: '',
  isActive: true,
  branchId: '',
};

// ─── Delete confirm dialog ─────────────────────────────────────────────────────

function DeleteConfirmDialog({
  product,
  onClose,
  onConfirm,
  isPending,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open onClose={onClose} title="Mahsulotni o'chirish">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{product.name}</span> mahsulotini
          o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Bekor
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'O\'chirilmoqda...' : 'O\'chirish'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Product form dialog ───────────────────────────────────────────────────────

function ProductFormDialog({
  editing,
  onClose,
}: {
  editing: Product | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';
  const { data: branchesData } = useBranches({ pageSize: 100 });
  const branches = branchesData?.items ?? [];

  const [form, setForm] = useState<CreateProductDto & { categoryId: string; branchId: string }>(
    editing
      ? {
          name: editing.name,
          sku: editing.sku,
          unit: editing.unit,
          costPrice: editing.costPrice,
          sellingPrice: editing.sellingPrice,
          stock: editing.stock,
          categoryId: editing.category?.id ?? '',
          isActive: editing.isActive,
          branchId: '',
        }
      : { ...emptyForm },
  );
  const [formError, setFormError] = useState('');

  const { data: catData } = useProductCategories({ pageSize: 200 });
  const categories = catData?.items ?? [];

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(editing?.id ?? '');

  const isPending = createMutation.isPending || updateMutation.isPending;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setFormError('');
    if (!form.name.trim()) { setFormError('Nomi kiritilishi shart'); return; }
    if (form.name.trim().length < 2) { setFormError("Nomi kamida 2 ta belgidan iborat bo'lishi kerak"); return; }
    if (!form.sku.trim()) { setFormError('SKU kiritilishi shart'); return; }
    if (form.sku.trim().length < 2) { setFormError("SKU kamida 2 ta belgidan iborat bo'lishi kerak"); return; }
    if (!form.unit.trim()) { setFormError("O'lchov birligi kiritilishi shart"); return; }
    if (Number(form.costPrice) < 0) { setFormError("Xarid narxi manfiy bo'lishi mumkin emas"); return; }
    if (Number(form.sellingPrice) <= 0) { setFormError("Sotish narxi 0 dan katta bo'lishi kerak"); return; }
    if (Number(form.stock) < 0) { setFormError("Stok manfiy bo'lishi mumkin emas"); return; }
    if (isSuperAdmin && !editing && !form.branchId) { setFormError('Filial tanlang'); return; }

    try {
      const payload: CreateProductDto = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        unit: form.unit,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stock: Number(form.stock),
        categoryId: form.categoryId || undefined,
        isActive: form.isActive,
        branchId: isSuperAdmin && !editing ? form.branchId : undefined,
      };

      if (editing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
      className="max-w-xl"
    >
      <div className="space-y-4">
        {isSuperAdmin && !editing && (
          <div className="space-y-1">
            <Label>Filial *</Label>
            <Select value={form.branchId} onChange={e => set('branchId', e.target.value)}>
              <option value="">Filial tanlang...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="pname">Nomi *</Label>
            <Input
              id="pname"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Mahsulot nomi"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="psku">SKU *</Label>
            <Input
              id="psku"
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              placeholder="Masalan: PRD-001"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="punit">Birlik</Label>
            <Select
              id="punit"
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pcat">Kategoriya</Label>
            <Select
              id="pcat"
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
            >
              <option value="">Kategoriyasiz</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="pcost">Narx (UZS)</Label>
            <Input
              id="pcost"
              type="number"
              min={0}
              value={form.costPrice}
              onChange={(e) => set('costPrice', Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="psell">Sotish narxi *</Label>
            <Input
              id="psell"
              type="number"
              min={0}
              value={form.sellingPrice}
              onChange={(e) => set('sellingPrice', Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pstock">{editing ? 'Stok' : 'Boshlang\'ich stok'}</Label>
            <Input
              id="pstock"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set('stock', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="pactive"
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
          />
          <Label htmlFor="pactive" className="cursor-pointer">Faol mahsulot</Label>
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {formError}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
            {isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Bekor
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const { data, isLoading, error } = useProducts({
    page,
    pageSize: 20,
    search: search || undefined,
    categoryId: categoryFilter || undefined,
    isActive: activeFilter === '' ? undefined : activeFilter === 'true',
  });

  const { data: catData } = useProductCategories({ pageSize: 200 });
  const categories = catData?.items ?? [];

  const deleteMutation = useDeleteProduct();

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  async function handleDelete() {
    if (!deleteProduct) return;
    try {
      await deleteMutation.mutateAsync(deleteProduct.id);
      setDeleteProduct(null);
    } catch {
      // error shown in dialog or silently
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mahsulotlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Barcha mahsulotlar va ularning inventarini boshqaring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={'/products/categories' as never}>
            <Button variant="outline" size="sm">
              <Tag className="mr-1.5 h-3.5 w-3.5" />
              Kategoriyalar
            </Button>
          </Link>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Yangi mahsulot
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nomi yoki SKU bo'yicha qidirish..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="w-full sm:w-44"
        >
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value as '' | 'true' | 'false'); setPage(1); }}
          className="w-full sm:w-36"
        >
          <option value="">Barcha holat</option>
          <option value="true">Faol</option>
          <option value="false">Nofaol</option>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Ma'lumotlarni yuklashda xatolik yuz berdi.
        </div>
      )}

      {/* Table */}
      <Card className="border border-border/60 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[220px]">Nomi / SKU</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Tannarx</TableHead>
                <TableHead>Sotish narxi</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-10 w-10 opacity-20" />
                      <p className="font-medium">Mahsulot topilmadi</p>
                      <p className="text-xs">Yangi mahsulot qo'shing yoki filtrni o'zgartiring</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.category?.name ?? (
                        <span className="italic text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatPrice(p.costPrice)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatPrice(p.sellingPrice)}</TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          p.stock <= 5 ? 'text-red-600' : 'text-foreground'
                        }`}
                      >
                        {p.stock} {p.unit}
                        {p.stock <= 5 && (
                          <span className="ml-1 text-xs text-red-500">(kam)</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? 'success' : 'secondary'}>
                        {p.isActive ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditProduct(p)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteProduct(p)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Jami: {total} ta mahsulot</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Oldingi
            </Button>
            <span className="px-2 font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Keyingi
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {createOpen && (
        <ProductFormDialog editing={null} onClose={() => setCreateOpen(false)} />
      )}
      {editProduct && (
        <ProductFormDialog editing={editProduct} onClose={() => setEditProduct(null)} />
      )}
      {deleteProduct && (
        <DeleteConfirmDialog
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onConfirm={handleDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

// needed for empty state icon used inline
function Package({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
