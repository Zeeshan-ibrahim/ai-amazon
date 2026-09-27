import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { SessionProvider } from '@/components/layout/SessionProvider';
import { ADMIN_ROLES } from '@/lib/types';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider roles={ADMIN_ROLES}>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
