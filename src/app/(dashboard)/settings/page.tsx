'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function SettingsPage() {
  const { user } = useAuth();

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Populate profile form from user
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  async function saveProfile() {
    setProfileError('');
    setProfileSuccess('');
    if (!profileForm.firstName.trim()) { setProfileError("Ismni kiriting"); return; }
    setProfileSaving(true);
    try {
      await apiClient.patch(`/users/${user?.id}`, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone || undefined,
      });
      setProfileSuccess("Profil muvaffaqiyatli yangilandi");
    } catch (e: unknown) {
      setProfileError(e instanceof Error ? e.message : 'Xato yuz berdi');
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePassword() {
    setPasswordError('');
    setPasswordSuccess('');
    if (!passwordForm.currentPassword) { setPasswordError("Joriy parolni kiriting"); return; }
    if (!passwordForm.newPassword) { setPasswordError("Yangi parolni kiriting"); return; }
    if (passwordForm.newPassword.length < 8) { setPasswordError("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return; }
    if (passwordForm.newPassword === passwordForm.currentPassword) { setPasswordError("Yangi parol joriy paroldan farq qilishi kerak"); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordError("Parollar mos kelmaydi"); return; }
    setPasswordSaving(true);
    try {
      await apiClient.patch(`/users/${user?.id}`, {
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
      });
      setPasswordSuccess("Parol muvaffaqiyatli o'zgartirildi");
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: unknown) {
      setPasswordError(e instanceof Error ? e.message : 'Xato yuz berdi');
    } finally {
      setPasswordSaving(false);
    }
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    BOSS: 'Boss',
    EMPLOYEE: 'Xodim',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Hisobingizni va xavfsizligingizni boshqaring</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profil ma&apos;lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <Badge variant="secondary" className="text-xs">{roleLabels[user.roleType] ?? user.roleType}</Badge>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Email (o&apos;zgartirish mumkin emas)</Label>
            <Input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ism *</Label>
              <Input
                placeholder="Ism"
                value={profileForm.firstName}
                onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Familiya</Label>
              <Input
                placeholder="Familiya"
                value={profileForm.lastName}
                onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Telefon raqami</Label>
            <Input
              placeholder="+998901234567"
              value={profileForm.phone}
              onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>

          {profileError && <p className="text-sm text-destructive">{profileError}</p>}
          {profileSuccess && <p className="text-sm text-green-600">{profileSuccess}</p>}

          <Button onClick={saveProfile} disabled={profileSaving}>
            {profileSaving ? 'Saqlanmoqda...' : 'Profilni saqlash'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Xavfsizlik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Joriy parol *</Label>
            <div className="relative">
              <Input
                type={showCurrentPw ? 'text' : 'password'}
                placeholder="Joriy parol"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrentPw(v => !v)}
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label>Yangi parol *</Label>
            <div className="relative">
              <Input
                type={showNewPw ? 'text' : 'password'}
                placeholder="Kamida 6 ta belgi"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNewPw(v => !v)}
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label>Yangi parolni tasdiqlang *</Label>
            <Input
              type="password"
              placeholder="Parolni qayta kiriting"
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
            />
          </div>

          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}

          <Button onClick={savePassword} disabled={passwordSaving}>
            {passwordSaving ? 'Saqlanmoqda...' : "Parolni o'zgartirish"}
          </Button>
        </CardContent>
      </Card>

      {/* Branch Info Section */}
      {user?.branch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Filial ma&apos;lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Filial nomi</p>
                <p className="font-medium">{user.branch.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Filial kodi</p>
                <Badge variant="outline" className="font-mono">{user.branch.code}</Badge>
              </div>
            </div>
            {user.branch.address && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Manzil</p>
                <p className="text-sm">{user.branch.address}</p>
              </div>
            )}
            {user.branch.phone && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Telefon</p>
                <p className="text-sm">{user.branch.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Holat</p>
              <Badge variant={user.branch.isActive ? 'success' : 'secondary'}>
                {user.branch.isActive ? 'Faol' : 'Nofaol'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
