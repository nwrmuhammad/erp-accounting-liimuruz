import { AuthProvider } from '@/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-[#f8f9fa] p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
