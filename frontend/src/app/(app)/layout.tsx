import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SessionProvider } from '@/components/layout/SessionProvider';

const USER_ROLES = ['user'] as const;

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider roles={USER_ROLES}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
