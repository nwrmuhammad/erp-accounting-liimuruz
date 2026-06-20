'use client';

import { useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!email.trim() || !password) {
      setError("Email va parolni kiriting");
      setLoading(false);
      return;
    }
    try {
      await login(email.trim(), password);
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-xl border border-border bg-white px-8 py-8 shadow-sm">
          {/* Logo */}
          <div className="mb-7 flex flex-col items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-sm">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                Accounting SaaS
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Hisobingizga kiring
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Parol
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="h-9"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-9 w-full text-sm font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kirilmoqda...
                </>
              ) : (
                'Kirish'
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 rounded-lg bg-[#f8f9fa] border border-border px-3 py-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              Demo hisob ma&apos;lumotlari
            </p>
            <div className="space-y-1 text-[11px] text-muted-foreground font-mono">
              <p>
                <span className="font-semibold text-foreground not-italic" style={{ fontFamily: 'inherit' }}>Admin:</span>{' '}
                admin@accounting-saas.uz
                <br />
                <span className="pl-9">admin123</span>
              </p>
              <p className="pt-1">
                <span className="font-semibold text-foreground not-italic" style={{ fontFamily: 'inherit' }}>Boss:</span>{' '}
                boss.chilonzor@accounting-saas.uz
                <br />
                <span className="pl-9">Boss12345!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
