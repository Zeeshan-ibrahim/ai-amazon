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
    <div className="space-y-8">
      <AdminPageHeader
        title="Sub-admins"
        subtitle="Each one manages only the members, plans and products they add"
        actions={
          <AdminButton onClick={() => setAdding(true)} icon={<UserPlusIcon className="h-5 w-5" />} className="py-4">
            Add sub-admin
          </AdminButton>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-[32px] border border-black/[0.07] bg-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.25)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b-2 border-ink">
                  {COLUMNS.map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={cn(
                        'px-5 py-7 text-[12px] font-extrabold uppercase leading-snug tracking-[0.16em] text-ink/80 first:pl-8 last:pr-8',
                        i === COLUMNS.length - 1 && 'text-right'
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {loading && !data
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={COLUMNS.length} className="px-8 py-5">
                          <Skeleton className="h-14 w-full" />
                        </td>
                      </tr>
                    ))
                  : subAdmins.map((subAdmin) => <SubAdminRow key={subAdmin.id} subAdmin={subAdmin} />)}
              </tbody>
            </table>
          </div>

          {!loading && subAdmins.length === 0 && (
            <EmptyState
              className="m-6 border-black/10"
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
    <tr className="transition-colors hover:bg-black/[0.015]">
      <td className="py-6 pl-8 pr-5">
        <div className="flex items-center gap-4">
          <MemberInitial name={subAdmin.displayName} />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-black uppercase tracking-tight text-ink">{subAdmin.displayName}</p>
            {subAdmin.username && <p className="truncate text-[14px] font-bold text-subtle">@{subAdmin.username}</p>}
            <p className="truncate text-[14px] text-subtle">{subAdmin.loginEmail}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-6">
        <AccountStatusBadge status={subAdmin.status} />
      </td>
      <td className="px-5 py-6 font-mono text-[17px] font-bold text-ink">{stats.members}</td>
      <td className="px-5 py-6 font-mono text-[17px] font-bold text-ink">{formatCurrency(stats.memberBalance)}</td>
      <td className="px-5 py-6 font-mono text-[15px] font-semibold text-subtle">
        {stats.plans} · {stats.products}
      </td>
      <td className="px-5 py-6">
        {stats.pendingRequests > 0 ? (
          <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink">
            {stats.pendingRequests} pending
          </span>
        ) : (
          <span className="text-subtle">—</span>
        )}
      </td>
      <td className="py-6 pl-5 pr-8 text-right">
        <Link
          href={`/admin/sub-admins/${subAdmin.id}`}
          className="inline-flex items-center gap-2.5 rounded-2xl bg-[#1c1c1c] px-5 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-black"
        >
          <EditIcon className="h-5 w-5" />
          Open
        </Link>
      </td>
    </tr>
  );
}
