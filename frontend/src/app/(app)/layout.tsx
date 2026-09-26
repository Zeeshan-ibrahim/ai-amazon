import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SessionProvider } from '@/components/layout/SessionProvider';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider role="user">
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
