'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeft, Tag, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  useProductCategories,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
} from '@/hooks/use-products';
import { useBranches } from '@/hooks/use-branches';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
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
import type { ProductCategory } from '@/types';

// ─── Delete confirm dialog ─────────────────────────────────────────────────────

function DeleteConfirmDialog({
  category,
  onClose,
  onConfirm,
  isPending,
}: {
  category: ProductCategory;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open onClose={onClose} title="Kategoriyani o'chirish">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{category.name}</span> kategoriyasini
          o'chirishni tasdiqlaysizmi? Ushbu kategoriyaga biriktirilgan mahsulotlar ta'sirlanishi
          mumkin.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Bekor
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Category form dialog ──────────────────────────────────────────────────────

function CategoryFormDialog({
  editing,
  onClose,
}: {
  editing: ProductCategory | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';
  const { data: branchesData } = useBranches({ pageSize: 100 });
  const branches = branchesData?.items ?? [];

  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [branchId, setBranchId] = useState('');
  const [formError, setFormError] = useState('');

  const createMutation = useCreateProductCategory();
  const updateMutation = useUpdateProductCategory(editing?.id ?? '');

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit() {
    setFormError('');
    if (!name.trim()) {
      setFormError('Kategoriya nomi kiritilishi shart');
      return;
    }
    if (isSuperAdmin && !editing && !branchId) {
      setFormError('Filial tanlang');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        branchId: isSuperAdmin && !editing ? branchId : undefined,
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
      title={editing ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
    >
      <div className="space-y-4">
        {isSuperAdmin && !editing && (
          <div className="space-y-1">
            <Label>Filial *</Label>
            <Select value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">Filial tanlang...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="cname">Nomi *</Label>
          <Input
            id="cname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kategoriya nomi"
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cdesc">Tavsif (ixtiyoriy)</Label>
          <Textarea
            id="cdesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kategoriya haqida qisqacha ma'lumot..."
            rows={3}
          />
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

export default function ProductCategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<ProductCategory | null>(null);

  const { data, isLoading, error } = useProductCategories({
    page,
    pageSize: 20,
    search: search || undefined,
  });

  const deleteMutation = useDeleteProductCategory();

  const categories = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  async function handleDelete() {
    if (!deleteCategory) return;
    try {
      await deleteMutation.mutateAsync(deleteCategory.id);
      setDeleteCategory(null);
    } catch {
      // silently handle
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={'/products' as never}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Kategoriyalar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Mahsulot kategoriyalarini boshqaring
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Yangi kategoriya
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kategoriya qidirish..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
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
                <TableHead className="w-[200px]">Nomi</TableHead>
                <TableHead>Tavsif</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Qo'shilgan sana</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Tag className="h-10 w-10 opacity-20" />
                      <p className="font-medium">Kategoriya topilmadi</p>
                      <p className="text-xs">
                        {search
                          ? 'Boshqa kalit so\'z bilan qidiring'
                          : 'Birinchi kategoriyangizni qo\'shing'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-sm">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {c.description ?? (
                        <span className="italic text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.branchName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString('uz-UZ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditCategory(c)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteCategory(c)}
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
          <span>Jami: {total} ta kategoriya</span>
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
        <CategoryFormDialog editing={null} onClose={() => setCreateOpen(false)} />
      )}
      {editCategory && (
        <CategoryFormDialog editing={editCategory} onClose={() => setEditCategory(null)} />
      )}
      {deleteCategory && (
        <DeleteConfirmDialog
          category={deleteCategory}
          onClose={() => setDeleteCategory(null)}
          onConfirm={handleDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
