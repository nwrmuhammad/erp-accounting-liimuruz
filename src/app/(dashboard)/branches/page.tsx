'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2, MapPin, Phone, Search } from 'lucide-react';
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from '@/hooks/use-branches';
import type { Branch } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type BranchForm = {
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
};

const emptyForm: BranchForm = {
  name: '',
  code: '',
  address: '',
  phone: '',
  isActive: true,
};

export default function BranchesPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useBranches({ pageSize: 100, search: search || undefined });
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch(editingBranch?.id ?? '');
  const deleteBranch = useDeleteBranch();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  function openCreate() {
    setEditingBranch(null);
    setForm(emptyForm);
    setFormError('');
    setOpen(true);
  }

  function openEdit(b: Branch) {
    setEditingBranch(b);
    setForm({
      name: b.name,
      code: b.code,
      address: b.address ?? '',
      phone: b.phone ?? '',
      isActive: b.isActive,
    });
    setFormError('');
    setOpen(true);
  }

  async function save() {
    setFormError('');
    if (!form.name.trim()) { setFormError("Filial nomini kiriting"); return; }
    if (form.name.trim().length < 2) { setFormError("Filial nomi kamida 2 ta belgidan iborat bo'lishi kerak"); return; }
    if (!form.code.trim()) { setFormError("Filial kodini kiriting"); return; }
    if (form.code.trim().length < 2) { setFormError("Filial kodi kamida 2 ta belgidan iborat bo'lishi kerak"); return; }
    if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) { setFormError("Filial kodi faqat harf, raqam yoki _ - belgilaridan iborat bo'lishi kerak"); return; }
    try {
      const dto = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        address: form.address?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        isActive: form.isActive,
      };
      if (editingBranch) {
        await updateBranch.mutateAsync(dto);
      } else {
        await createBranch.mutateAsync(dto);
      }
      setOpen(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Xato yuz berdi');
    }
  }

  async function remove(id: string) {
    if (!confirm("Filialni o'chirishni tasdiqlaysizmi?")) return;
    await deleteBranch.mutateAsync(id).catch(console.error);
  }

  const isSaving = createBranch.isPending || updateBranch.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Filiallar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Jami: {total} ta filial</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Yangi filial
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filial nomi bo'yicha qidirish..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Xatolik: {error instanceof Error ? error.message : "Ma'lumot yuklanmadi"}
        </div>
      )}

      {/* Branch Cards Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p className="text-base font-medium">Filial topilmadi</p>
          <p className="text-sm mt-1">Birinchi filialni yarating</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(b => (
            <Card key={b.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{b.name}</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs mt-0.5">{b.code}</Badge>
                    </div>
                  </div>
                  <Badge variant={b.isActive ? 'success' : 'secondary'} className="flex-shrink-0">
                    {b.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {b.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{b.address}</span>
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-1">
                  Yaratilgan: {new Date(b.createdAt).toLocaleDateString('uz-UZ')}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(b)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />Tahrirlash
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} title={editingBranch ? 'Filialni tahrirlash' : 'Yangi filial'} className="max-w-md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nomi *</Label>
              <Input
                placeholder="Filial nomi"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Kod * (masalan: CHL)</Label>
              <Input
                placeholder="CHL"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="font-mono uppercase"
              />
            </div>
          </div>
          <div>
            <Label>Manzil</Label>
            <Textarea
              placeholder="To'liq manzil..."
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              rows={2}
            />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input
              placeholder="+998901234567"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isActive" className="cursor-pointer">Filial faol</Label>
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
