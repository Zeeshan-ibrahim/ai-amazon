'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminButton, AdminPageHeader, AdminSearch, MemberInitial, RoleBadge, Segment } from '@/components/admin/ui';
import { useSession } from '@/components/layout/SessionProvider';
import { ChatThread } from '@/components/messages/ChatThread';
import { UnreadBadge, useUnread } from '@/components/messages/UnreadProvider';
import { ChevronLeftIcon, CrownIcon, PlusIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useDebounced } from '@/hooks/useDebounced';
import { usePolling } from '@/hooks/usePolling';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { InboxItem, MessageContact, Role } from '@/lib/types';

/** How often the open Messages page refreshes the conversation list. */
const INBOX_POLL_MS = 10_000;
const PAGE_SIZE = 50;

type Kind = 'all' | 'user' | 'sub_admin';

const listTime = (iso: string) => {
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
      <Messages />
    </Suspense>
  );
}

/**
 * The admin inbox. A sub-admin handles their own traders and has one thread
 * of their own with the super-admin (pinned on top). A super-admin handles
 * every sub-admin plus the traders nobody else owns. `?with=<memberId>`
 * (or `?with=me`) opens a conversation, so other pages can link here.
 */
function Messages() {
  const { user } = useSession();
  const { counts } = useUnread();
  const router = useRouter();
  const pathname = usePathname();
  const selected = useSearchParams().get('with');
  const isSuperAdmin = user?.role === 'super_admin';

  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const [kind, setKind] = useState<Kind>('all');
  const [items, setItems] = useState<InboxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  // Responses for a superseded search or filter are dropped.
  const generation = useRef(0);

  const fetchInbox = useCallback(
    (params: { limit?: number; offset?: number } = {}) =>
      api.messages.inbox({ q, kind: kind === 'all' ? undefined : kind, ...params }),
    [q, kind]
  );

  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchInbox();
      if (current !== generation.current) return;
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (current === generation.current) setError(userMessage(err, "We couldn't load your messages."));
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [fetchInbox]);

  useEffect(() => {
    load();
  }, [load]);

  /** Quiet refresh of every row shown so far (including "Load more" pages): no spinner. */
  const shown = Math.max(items.length, PAGE_SIZE);
  const refresh = useCallback(async () => {
    const current = generation.current;
    const page = await fetchInbox({ limit: shown });
    if (current !== generation.current) return;
    setItems(page.items);
    setTotal(page.total);
  }, [fetchInbox, shown]);
  usePolling(refresh, INBOX_POLL_MS, !loading && !error);

  const loadMore = async () => {
    const page = await fetchInbox({ offset: items.length });
    setItems((prev) => {
      const seen = new Set(prev.map((item) => item.member.id));
      return [...prev, ...page.items.filter((item) => !seen.has(item.member.id))];
    });
    setTotal(page.total);
  };

  const open = useCallback(
    (id: string | null) => router.replace(id ? `${pathname}?with=${id}` : pathname, { scroll: false }),
    [router, pathname]
  );

  const onActivity = useCallback(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const selectedItem = items.find((item) => item.member.id === selected);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Messages"
        subtitle={
          isSuperAdmin
            ? 'Conversations with your sub-admins and the members you manage directly'
            : 'Conversations with your members, and with the super-admin'
        }
        actions={
          <AdminButton icon={<PlusIcon className="h-4 w-4" />} onClick={() => setPicking(true)}>
            New message
          </AdminButton>
        }
      />

      <div className="grid gap-4 lg:h-[calc(100dvh-230px)] lg:min-h-[520px] lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Conversation list — hidden on small screens while a thread is open. */}
        <aside
          className={cn(
            'flex min-h-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card',
            selected && 'hidden lg:flex'
          )}
        >
          <div className="space-y-3 border-b border-line p-3">
            <AdminSearch value={query} onChange={setQuery} placeholder="Search conversations" tone="plain" />
            {isSuperAdmin && (
              <div role="tablist" className="flex gap-1 rounded-xl bg-cream p-1">
                <Segment active={kind === 'all'} tone="dark" onClick={() => setKind('all')}>
                  All
                </Segment>
                <Segment active={kind === 'user'} tone="dark" onClick={() => setKind('user')}>
                  Members
                </Segment>
                <Segment active={kind === 'sub_admin'} tone="gold" onClick={() => setKind('sub_admin')}>
                  Sub-admins
                </Segment>
              </div>
            )}
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {user?.role === 'sub_admin' && (
              <li>
                <ConversationRow
                  active={selected === 'me'}
                  onClick={() => open('me')}
                  name="Super-admin"
                  role="super_admin"
                  preview="Your line to the super-admin"
                  unread={counts.own}
                />
              </li>
            )}
            {loading ? (
              <li className="space-y-2 p-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </li>
            ) : error ? (
              <li className="p-3">
                <ErrorState message={error} onRetry={load} />
              </li>
            ) : items.length === 0 ? (
              <li className="p-3">
                <EmptyState
                  title={q ? 'No conversations match.' : 'No conversations yet.'}
                  hint={q ? undefined : 'Members who message you show up here.'}
                />
              </li>
            ) : (
              <>
                {items.map((item) => (
                  <li key={item.member.id}>
                    <ConversationRow
                      active={selected === item.member.id}
                      onClick={() => open(item.member.id)}
                      name={item.member.displayName}
                      handle={item.member.handle}
                      role={item.member.role}
                      suspended={item.member.status === 'suspended'}
                      preview={
                        item.lastMessage ? `${item.lastMessage.fromMember ? '' : 'You: '}${item.lastMessage.body}` : ''
                      }
                      time={item.lastMessage?.createdAt}
                      unread={item.unread}
                    />
                  </li>
                ))}
                {items.length < total && (
                  <li className="p-3 text-center">
                    <AdminButton variant="outline" size="sm" onClick={() => loadMore().catch(() => {})}>
                      Load more
                    </AdminButton>
                  </li>
                )}
              </>
            )}
          </ul>
        </aside>

        {/* Open conversation. */}
        <div className={cn('min-h-0', !selected && 'hidden lg:block')}>
          {selected ? (
            <ChatThread
              key={selected}
              threadId={selected}
              adminView={selected !== 'me'}
              otherLabel={selected === 'me' ? 'Super-admin' : selectedItem?.member.displayName ?? 'Member'}
              onActivity={onActivity}
              emptyHint={selected === 'me' ? 'Write to the super-admin. Replies show up here.' : 'Start the conversation.'}
              className="h-[calc(100dvh-180px)] min-h-[440px] lg:h-full lg:min-h-0"
              header={(member) => (
                <ThreadHeader member={member} own={selected === 'me'} onBack={() => open(null)} />
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-card border border-dashed border-line bg-surface/50 p-8 text-center">
              <div>
                <p className="text-sm text-muted">Pick a conversation.</p>
                <p className="mt-1.5 text-[13px] text-subtle">Or start one with New message.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ContactPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(contact) => {
          setPicking(false);
          open(contact.id);
        }}
      />
    </div>
  );
}

/**
 * One inbox row. Unread conversations stand out with a gold edge, bold name
 * and count; sub-admins get a crown so a super-admin can tell them apart.
 */
function ConversationRow({
  active,
  onClick,
  name,
  handle,
  role,
  suspended,
  preview,
  time,
  unread,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  handle?: string;
  role: Role;
  suspended?: boolean;
  preview: string;
  time?: string;
  unread: number;
}) {
  const isAdmin = role !== 'user';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full items-center gap-3 border-b border-l-[3px] border-b-line px-3 py-3 text-left transition-colors',
        active ? 'bg-brand-50' : unread ? 'bg-amber-50/70 hover:bg-amber-50' : 'hover:bg-cream',
        unread ? 'border-l-gold' : active ? 'border-l-brand-500' : 'border-l-transparent'
      )}
    >
      {isAdmin ? <AdminAvatar /> : <MemberInitial name={name} />}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn('truncate text-[14px] text-ink', unread ? 'font-semibold' : 'font-medium')}>{name}</span>
          {role === 'sub_admin' && <RoleBadge role="sub_admin" />}
          {suspended && <span className="text-[10px] uppercase tracking-[0.1em] text-dangerSoft">Suspended</span>}
          {time && <span className="ml-auto shrink-0 text-[11px] text-subtle">{listTime(time)}</span>}
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={cn('truncate text-[13px]', unread ? 'text-ink' : 'text-muted')}>
            {preview || (handle ? `@${handle}` : '')}
          </span>
          <UnreadBadge count={unread} className="ml-auto shrink-0" />
        </span>
      </span>
    </button>
  );
}

/** Dark disc with a gold crown: marks an admin (sub-admin or super-admin) at a glance. */
function AdminAvatar() {
  return (
    <span aria-hidden className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
      <CrownIcon className="h-5 w-5" />
    </span>
  );
}

function ThreadHeader({
  member,
  own,
  onBack,
}: {
  member: MessageContact | null;
  own: boolean;
  onBack: () => void;
}) {
  const isSubAdmin = member?.role === 'sub_admin';
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to conversations"
        className="-ml-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-ink lg:hidden"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      {own || isSubAdmin ? <AdminAvatar /> : <MemberInitial name={member?.displayName ?? '?'} />}
      <div className="min-w-0 flex-1">
        {own ? (
          <>
            <p className="text-[15px] font-medium text-ink">Super-admin</p>
            <p className="text-[12px] text-muted">Your own conversation with the super-admin</p>
          </>
        ) : member ? (
          <>
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-medium text-ink">{member.displayName}</p>
              <RoleBadge role={member.role} outlined />
            </div>
            <p className="truncate text-[12px] text-muted">
              @{member.handle} · {member.email}
            </p>
          </>
        ) : (
          <Skeleton className="h-9 w-48" />
        )}
      </div>
      {member && (
        <Link
          href={`/admin/members/${member.id}`}
          className="hidden shrink-0 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:border-ink/25 hover:bg-cream sm:inline-flex"
        >
          View profile
        </Link>
      )}
    </div>
  );
}

/** "New message": search the people this admin can write to. */
function ContactPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (contact: MessageContact) => void;
}) {
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const [contacts, setContacts] = useState<MessageContact[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    api.messages
      .contacts(q)
      .then((list) => !cancelled && setContacts(list))
      .catch((err) => !cancelled && setError(userMessage(err, "We couldn't load your contacts.")));
    return () => {
      cancelled = true;
    };
  }, [open, q]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setContacts(null);
    }
  }, [open]);

  return (
    <AdminModal open={open} onClose={onClose} title="New message">
      <AdminSearch value={query} onChange={setQuery} placeholder="Search by name, username or email" tone="plain" />
      <div className="mt-4">
        {error ? (
          <ErrorState message={error} />
        ) : contacts === null ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState title={q ? 'Nobody matches.' : 'Nobody to message yet.'} />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <button
                  type="button"
                  onClick={() => onPick(contact)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cream"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink">{contact.displayName}</span>
                    <span className="block truncate text-[12px] text-muted">
                      @{contact.handle} · {contact.email}
                    </span>
                  </span>
                  <RoleBadge role={contact.role} outlined />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminModal>
  );
}
