'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddMemberModal } from '@/components/admin/members/AddMemberModal';
import {
  AdminButton,
  AdminPageHeader,
  AdminSearch,
  MemberInitial,
  RoleBadge,
} from '@/components/admin/ui';
import { EditIcon, UserPlusIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useDebounced } from '@/hooks/useDebounced';
import { usePagedList } from '@/hooks/usePagedList';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Member } from '@/lib/types';

const COLUMNS = ['Member portrait', 'Administrative role', 'Portfolio value', 'Invitation ID', 'Panel'];

export default function MembersPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const q = useDebounced(query.trim());

  const fetchPage = useCallback((offset: number) => api.admin.members({ q, offset }), [q]);
  const { items, total, loading, loadingMore, error, hasMore, loadMore, reload } =
    usePagedList<Member>(fetchPage);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Group management"
        subtitle="Audit profiles, allocate products, and adjust balances"
        actions={
          <>
            <AdminSearch
              value={query}
              onChange={setQuery}
              placeholder="Filter members..."
              className="w-full sm:w-[340px]"
            />
            <AdminButton
              onClick={() => setAdding(true)}
              icon={<UserPlusIcon className="h-5 w-5" />}
              className="py-4"
            >
              Add member
            </AdminButton>
          </>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="overflow-hidden rounded-[32px] border border-black/[0.07] bg-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.25)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b-2 border-ink">
                  {COLUMNS.map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={
                        'px-6 py-7 text-[12px] font-extrabold uppercase leading-snug tracking-[0.16em] text-ink/80 first:pl-8 last:pr-8 ' +
                        (i === COLUMNS.length - 1 ? 'text-right' : '')
                      }
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={COLUMNS.length} className="px-8 py-5">
                          <Skeleton className="h-14 w-full" />
                        </td>
                      </tr>
                    ))
                  : items.map((member) => <MemberRow key={member.id} member={member} />)}
              </tbody>
            </table>
          </div>

          {!loading && items.length === 0 && (
            <EmptyState
              className="m-6 border-black/10"
              title={q ? `No members match "${q}".` : 'No members yet.'}
            />
          )}

          {hasMore && (
            <div className="border-t border-black/[0.06] p-5 text-center">
              <AdminButton variant="outline" size="sm" loading={loadingMore} onClick={loadMore}>
                Load more ({items.length} of {total})
              </AdminButton>
            </div>
          )}
        </div>
      )}

      <AddMemberModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(member) => {
          setAdding(false);
          router.push(`/admin/members/${member.id}`);
        }}
      />
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <tr className="transition-colors hover:bg-black/[0.015]">
      <td className="py-6 pl-8 pr-6">
        <div className="flex items-center gap-4">
          <MemberInitial name={member.displayName} />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-black uppercase tracking-tight text-ink">
              {member.displayName}
            </p>
            {member.username && (
              <p className="truncate text-[14px] font-bold text-subtle">@{member.username}</p>
            )}
            <p className="truncate text-[14px] text-subtle">{member.loginEmail}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <RoleBadge role={member.role} />
      </td>
      <td className="px-6 py-6 font-mono text-[17px] font-bold text-ink">
        {formatCurrency(member.balance)}
      </td>
      <td className="px-6 py-6 font-mono text-[15px] font-semibold tracking-[0.12em] text-subtle">
        {member.inviteCode}
      </td>
      <td className="py-6 pl-6 pr-8 text-right">
        <Link
          href={`/admin/members/${member.id}`}
          className="inline-flex items-center gap-2.5 rounded-2xl bg-[#1c1c1c] px-5 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-black"
        >
          <EditIcon className="h-5 w-5" />
          Manage
        </Link>
      </td>
    </tr>
  );
}
