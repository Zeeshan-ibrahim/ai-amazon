'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { ErrorState } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api';
import { homeFor } from '@/lib/auth';
import type { Role, User } from '@/lib/types';

type SessionValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  setUser: () => {},
  logout: async () => {},
});

/**
 * Loads the signed-in user once and shares it across the shell, and gates
 * the whole subtree on `role`: signed-out visitors go to `/login`, and a
 * signed-in person with a different role is sent to their own app. Children
 * only render once the role matches, so pages never flash for the wrong role.
 *
 * This is UX only — the API enforces the same rule on every request.
 */
export function SessionProvider({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setUser(await api.me());
    } catch (err) {
      setUser(null);
      // 401/403 mean "no usable session"; anything else is the API being unreachable.
      if (!(err instanceof ApiError && (err.status === 401 || err.status === 403))) {
        setError(err instanceof Error ? err.message : 'Unable to reach the server.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setUser(null);
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading || error) return;
    if (!user) router.replace('/login');
    else if (user.role !== role) router.replace(homeFor(user.role));
  }, [loading, error, user, role, router]);

  const value = useMemo(
    () => ({ user, loading, refresh, setUser, logout }),
    [user, loading, refresh, logout]
  );

  let content = children;
  if (error) {
    content = (
      <div className="mx-auto max-w-md px-4 py-24">
        <ErrorState message={error} onRetry={refresh} />
      </div>
    );
  } else if (user?.role !== role) {
    content = (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-subtle border-t-transparent" />
      </div>
    );
  }

  return (
    <SessionContext.Provider value={value}>{content}</SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
