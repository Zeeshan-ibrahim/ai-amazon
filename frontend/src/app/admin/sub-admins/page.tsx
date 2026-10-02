'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AddMemberModal } from '@/components/admin/members/AddMemberModal';
import { AccountStatusBadge, AdminButton, AdminPageHeader, MemberInitial } from '@/components/admin/ui';
import { EditIcon, UserPlusIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { SubAdmin } from '@/lib/types';

const COLUMNS = ['Sub-admin', 'Status', 'Members', 'Member balances', 'Plans · products', 'Own requests', 'Panel'];

const fetchSubAdmins = () => api.admin.subAdmins();

/** Super-admin only (see `only` in lib/nav.ts); the API enforces the same. */
export default function SubAdminsPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApi<SubAdmin[]>(fetchSubAdmins);
  const [adding, setAdding] = useState(false);
  const subAdmins = data ?? [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <AdminPageHeader
        title="Sub-admins"
        subtitle="Each one manages only the members, plans and products they add"
        actions={
          <AdminButton onClick={() => setAdding(true)} icon={<UserPlusIcon className="h-[18px] w-[18px]" />}>
            Add sub-admin
          </AdminButton>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-line bg-cream/60">
                  {COLUMNS.map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={cn(
                        'px-5 py-4 text-[10px] font-medium uppercase leading-snug tracking-[0.14em] text-subtle first:pl-6 last:pr-6',
                        i === COLUMNS.length - 1 && 'text-right'
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading && !data
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={COLUMNS.length} className="px-6 py-4">
                          <Skeleton className="h-12 w-full" />
                        </td>
                      </tr>
                    ))
                  : subAdmins.map((subAdmin) => <SubAdminRow key={subAdmin.id} subAdmin={subAdmin} />)}
              </tbody>
            </table>
          </div>

          {!loading && subAdmins.length === 0 && (
            <EmptyState
              className="m-5"
              title="No sub-admins yet."
              hint="Add one to give them the admin portal for their own members."
            />
          )}
        </div>
      )}

      <AddMemberModal
        kind="subAdmin"
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(created) => {
          setAdding(false);
          router.push(`/admin/sub-admins/${created.id}`);
        }}
      />
    </div>
  );
}

function SubAdminRow({ subAdmin }: { subAdmin: SubAdmin }) {
  const { stats } = subAdmin;
  return (
    <tr className="transition-colors hover:bg-cream/70">
      <td className="py-4 pl-6 pr-5">
        <div className="flex items-center gap-4">
          <MemberInitial name={subAdmin.displayName} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium tracking-tight text-ink">{subAdmin.displayName}</p>
            {subAdmin.username && <p className="truncate text-[13px] text-muted">@{subAdmin.username}</p>}
            <p className="truncate text-[13px] text-subtle">{subAdmin.loginEmail}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <AccountStatusBadge status={subAdmin.status} />
      </td>
      <td className="px-5 py-4 tabular text-[15px] font-medium text-ink">{stats.members}</td>
      <td className="px-5 py-4 tabular text-[15px] font-medium text-ink">{formatCurrency(stats.memberBalance)}</td>
      <td className="px-5 py-4 tabular text-[14px] text-muted">
        {stats.plans} · {stats.products}
      </td>
      <td className="px-5 py-4">
        {stats.pendingRequests > 0 ? (
          <span className="rounded-md bg-brand-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-brand-600">
            {stats.pendingRequests} pending
          </span>
        ) : (
          <span className="text-subtle">—</span>
        )}
      </td>
      <td className="py-4 pl-5 pr-6 text-right">
        <Link
          href={`/admin/sub-admins/${subAdmin.id}`}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[13px] font-medium text-ink transition-colors hover:border-ink/25 hover:bg-cream"
        >
          <EditIcon className="h-4 w-4" />
          Open
        </Link>
      </td>
    </tr>
  );
}
