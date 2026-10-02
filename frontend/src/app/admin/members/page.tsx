'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddMemberModal } from '@/components/admin/members/AddMemberModal';
import {
  AddedByBadge,
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
import { handleOf, useSubAdmins } from '@/hooks/useSubAdmins';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { Member } from '@/lib/types';

const COLUMNS = ['Member portrait', 'Administrative role', 'Portfolio value', 'Invitation ID', 'Panel'];
/** Super-admins also see who owns each account. */
const SUPER_COLUMNS = ['Member portrait', 'Administrative role', 'Added by', 'Portfolio value', 'Invitation ID', 'Panel'];

export default function MembersPage() {
  const router = useRouter();
  const { isSuperAdmin, subAdmins } = useSubAdmins();
  const [query, setQuery] = useState('');
  const [addedBy, setAddedBy] = useState('');
  const [adding, setAdding] = useState(false);
  const q = useDebounced(query.trim());
  const columns = isSuperAdmin ? SUPER_COLUMNS : COLUMNS;

  const fetchPage = useCallback(
    (offset: number) => api.admin.members({ q, addedBy: addedBy || undefined, offset }),
    [q, addedBy]
  );
  const { items, total, loading, loadingMore, error, hasMore, loadMore, reload } =
    usePagedList<Member>(fetchPage);

  return (
    <div className="space-y-6 lg:space-y-8">
      <AdminPageHeader
        title="Group management"
        subtitle={
          isSuperAdmin
            ? 'Audit profiles, allocate products, and adjust balances'
            : 'Your members — audit profiles, allocate products, and adjust balances'
        }
        actions={
          <>
            {isSuperAdmin && (
              <label className="relative block w-full sm:w-[240px]">
                <span className="sr-only">Added by</span>
                <select
                  value={addedBy}
                  onChange={(e) => setAddedBy(e.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                >
                  <option value="">All owners</option>
                  <option value="super">Super-admin</option>
                  {subAdmins.map((s) => (
                    <option key={s.id} value={s.id}>
                      {handleOf(s)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <AdminSearch
              value={query}
              onChange={setQuery}
              placeholder="Filter members..."
              className="w-full sm:w-[340px]"
            />
            <AdminButton
              onClick={() => setAdding(true)}
              icon={<UserPlusIcon className="h-[18px] w-[18px]" />}
              
            >
              Add member
            </AdminButton>
          </>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-line bg-cream/60">
                  {columns.map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={cn(
                        'px-6 py-4 text-[10px] font-medium uppercase leading-snug tracking-[0.14em] text-subtle first:pl-6 last:pr-6',
                        i === columns.length - 1 && 'text-right'
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={columns.length} className="px-6 py-4">
                          <Skeleton className="h-12 w-full" />
                        </td>
                      </tr>
                    ))
                  : items.map((member) => (
                      <MemberRow key={member.id} member={member} showOwner={isSuperAdmin} />
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && items.length === 0 && (
            <EmptyState
              className="m-5"
              title={q || addedBy ? 'No members match these filters.' : 'No members yet.'}
            />
          )}

          {hasMore && (
            <div className="border-t border-line p-5 text-center">
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

function MemberRow({ member, showOwner }: { member: Member; showOwner: boolean }) {
  return (
    <tr className="transition-colors hover:bg-cream/70">
      <td className="py-4 pl-6 pr-6">
        <div className="flex items-center gap-4">
          <MemberInitial name={member.displayName} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium tracking-tight text-ink">
              {member.displayName}
            </p>
            {member.username && (
              <p className="truncate text-[13px] text-muted">@{member.username}</p>
            )}
            <p className="truncate text-[13px] text-subtle">{member.loginEmail}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <RoleBadge role={member.role} />
      </td>
      {showOwner && (
        <td className="px-6 py-4">
          {member.role === 'user' ? <AddedByBadge addedBy={member.addedBy} /> : <span className="text-subtle">—</span>}
        </td>
      )}
      <td className="px-6 py-4 tabular text-[15px] font-medium text-ink">
        {formatCurrency(member.balance)}
      </td>
      <td className="px-6 py-4 font-mono text-[13px] text-muted">
        {member.inviteCode}
      </td>
      <td className="py-4 pl-6 pr-6 text-right">
        <Link
          href={`/admin/members/${member.id}`}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[13px] font-medium text-ink transition-colors hover:border-ink/25 hover:bg-cream"
        >
          <EditIcon className="h-4 w-4" />
          Manage
        </Link>
      </td>
    </tr>
  );
}
