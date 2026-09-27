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
    <div className="space-y-8">
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
                  className="w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-[13px] font-bold uppercase tracking-[0.12em] text-ink focus:border-black/40 focus:outline-none focus:ring-4 focus:ring-gold/20"
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
                  {columns.map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={
                        'px-6 py-7 text-[12px] font-extrabold uppercase leading-snug tracking-[0.16em] text-ink/80 first:pl-8 last:pr-8 ' +
                        (i === columns.length - 1 ? 'text-right' : '')
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
                        <td colSpan={columns.length} className="px-8 py-5">
                          <Skeleton className="h-14 w-full" />
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
              className="m-6 border-black/10"
              title={q || addedBy ? 'No members match these filters.' : 'No members yet.'}
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

function MemberRow({ member, showOwner }: { member: Member; showOwner: boolean }) {
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
      {showOwner && (
        <td className="px-6 py-6">
          {member.role === 'user' ? <AddedByBadge addedBy={member.addedBy} /> : <span className="text-subtle">—</span>}
        </td>
      )}
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
