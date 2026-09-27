'use client';

import { useCallback } from 'react';
import { useSession } from '@/components/layout/SessionProvider';
import { api } from '@/lib/api';
import type { SubAdmin } from '@/lib/types';
import { useApi } from './useApi';

/**
 * Sub-admins for owner pickers and filters. Only a super-admin can list
 * them; for anyone else this resolves to an empty list without a request.
 */
export function useSubAdmins() {
  const { user } = useSession();
  const isSuperAdmin = user?.role === 'super_admin';
  const fetcher = useCallback(
    () => (isSuperAdmin ? api.admin.subAdmins() : Promise.resolve<SubAdmin[]>([])),
    [isSuperAdmin]
  );
  const { data } = useApi<SubAdmin[]>(fetcher);
  return { isSuperAdmin, subAdmins: data ?? [] };
}

/** "@handle" for a sub-admin option. */
export const handleOf = (s: Pick<SubAdmin, 'username' | 'loginEmail'>) =>
  `@${s.username || s.loginEmail.split('@')[0]}`;
