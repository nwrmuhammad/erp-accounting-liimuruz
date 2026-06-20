'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/use-users';
import { useBranches } from '@/hooks/use-branches';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const PAGE_SIZE = 20;

type RoleType = 'SUPER_ADMIN' | 'BOSS' | 'EMPLOYEE';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: 'Super Admin',
  BOSS: 'Boss',
  EMPLOYEE: 'Xodim',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Faol',
  INACTIVE: 'Nofaol',
  SUSPENDED: 'Bloklangan',
};

type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  roleType: RoleType;
  branchId: string;
};

const emptyForm: UserForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  roleType: 'EMPLOYEE',
  branchId: '',
};

function roleBadge(role: RoleType) {
  if (role === 'SUPER_ADMIN') return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
  if (role === 'BOSS') return <Badge className="bg-blue-100 text-blue-800">Boss</Badge>;
  return <Badge variant="secondary">Xodim</Badge>;
}

function statusBadge(status: UserStatus) {
  if (status === 'ACTIVE') return <Badge variant="success">Faol</Badge>;
  if (status === 'SUSPENDED') return <Badge variant="destructive">Bloklangan</Badge>;
  return <Badge variant="outline">Nofaol</Badge>;
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useUsers({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    roleType: roleFilter || undefined,
  });

  const { data: branchesData } = useBranches({ pageSize: 100 });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(editingUser?.id ?? '');
  const deleteUser = useDeleteUser();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const branches = branchesData?.items ?? [];

  // Client-side status filter since API may not support it directly
  const filteredItems = statusFilter
    ? items.filter(u => u.status === statusFilter)
    : items;

  function openCreate() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: '',
      phone: u.phone ?? '',
      roleType: u.roleType,
      branchId: u.branch?.id ?? '',
    });
    setFormError('');
    setOpen(true);
  }

  async function save() {
    setFormError('');
    if (!form.firstName.trim()) { setFormError("Ismni kiriting"); return; }
    if (!form.email.trim()) { setFormError("Emailni kiriting"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setFormError("Email formati noto'g'ri"); return; }
    if (!editingUser && !form.password) { setFormError("Parolni kiriting"); return; }
    if (!editingUser && form.password.length < 8) { setFormError("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return; }
    if (form.password && form.password.length < 8) { setFormError("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return; }
    if (form.roleType !== 'SUPER_ADMIN' && !form.branchId) { setFormError("Filial tanlang"); return; }
    try {
      const dto: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        roleType: form.roleType,
        branchId: form.branchId || undefined,
        phone: form.phone || undefined,
      };
      if (form.password) dto.password = form.password;
      if (editingUser) {
        await updateUser.mutateAsync(dto as Parameters<typeof updateUser.mutateAsync>[0]);
      } else {
        await createUser.mutateAsync({ ...dto, password: form.password } as Parameters<typeof createUser.mutateAsync>[0]);
      }
      setOpen(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Xato yuz berdi');
    }
  }

  async function remove(id: string) {
    if (!confirm("Foydalanuvchini o'chirishni tasdiqlaysizmi?")) return;
    await deleteUser.mutateAsync(id).catch(console.error);
  }

  const isSaving = createUser.isPending || updateUser.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foydalanuvchilar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tizim foydalanuvchilarini boshqaring</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Yangi foydalanuvchi
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ism yoki email bo'yicha qidirish..."
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="w-44"
        >
          <option value="">Barcha rollar</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="BOSS">Boss</option>
          <option value="EMPLOYEE">Xodim</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-44"
        >
          <option value="">Barcha holat</option>
          <option value="ACTIVE">Faol</option>
          <option value="INACTIVE">Nofaol</option>
          <option value="SUSPENDED">Bloklangan</option>
        </Select>
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
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Oxirgi kirish</TableHead>
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
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Foydalanuvchi topilmadi
                  </TableCell>
                </TableRow>
              ) : filteredItems.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold flex-shrink-0">
                        {initials(u.firstName, u.lastName)}
                      </div>
                      <div>
                        <p className="font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleBadge(u.roleType)}</TableCell>
                  <TableCell className="text-sm">{u.branch?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{statusBadge(u.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString('uz-UZ')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(u.id)}>
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

      {/* Create / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} title={editingUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'} className="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ism *</Label>
              <Input
                placeholder="Ism"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Familiya</Label>
              <Input
                placeholder="Familiya"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <Label>{editingUser ? 'Yangi parol (ixtiyoriy)' : 'Parol *'}</Label>
            <Input
              type="password"
              placeholder={editingUser ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Kamida 6 ta belgi"}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div>
            <Label>Telefon (ixtiyoriy)</Label>
            <Input
              placeholder="+998901234567"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rol *</Label>
              <Select
                value={form.roleType}
                onChange={e => setForm(f => ({ ...f, roleType: e.target.value as RoleType }))}
              >
                {(Object.entries(ROLE_LABELS) as [RoleType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Filial {form.roleType !== 'SUPER_ADMIN' ? '*' : ''}</Label>
              <Select
                value={form.branchId}
                onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
              >
                <option value="">Tanlanmagan</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
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
