import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { SessionProvider } from '@/components/layout/SessionProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider role="admin">
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
