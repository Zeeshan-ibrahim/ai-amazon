'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { usePolling } from '@/hooks/usePolling';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { ChatMessage, MessageContact, ThreadId } from '@/lib/types';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { useUnread } from './UnreadProvider';

/** How often an open conversation checks for new messages. */
const THREAD_POLL_MS = 4_000;
const MAX_LENGTH = 2000;

/** Pixels from the bottom that still count as "reading the latest". */
const STICKY_BOTTOM_PX = 120;

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const dayOf = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Adds `incoming` to `list`, skipping ids already there, oldest first. */
const merge = (list: ChatMessage[], incoming: ChatMessage[]) => {
  const seen = new Set(list.map((m) => m.id));
  const added = incoming.filter((m) => !seen.has(m.id));
  return added.length ? [...list, ...added].sort((a, b) => a.id - b.id) : list;
};

/**
 * One conversation: history, composer and live updates. Polls for new
 * messages only while it is mounted and the tab is visible, and marks what
 * the viewer has on screen as read (which also clears the sidebar badge).
 *
 * `otherLabel` names the other side on their bubbles. In the admin view
 * (`adminView`), the member's messages are set apart with a gold accent and
 * admin-side messages written by a different admin carry that admin's handle.
 */
export function ChatThread({
  threadId,
  header,
  otherLabel,
  adminView = false,
  emptyHint,
  onActivity,
  className,
}: {
  threadId: ThreadId;
  /** A function gets the member once loaded (admin view; null in the viewer's own thread). */
  header?: ReactNode | ((member: MessageContact | null) => ReactNode);
  otherLabel: string;
  adminView?: boolean;
  emptyHint?: string;
  /** After sending, or after reading new messages — e.g. to refresh an inbox. */
  onActivity?: () => void;
  className?: string;
}) {
  const { setCounts } = useUnread();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [otherReadId, setOtherReadId] = useState(0);
  const [member, setMember] = useState<MessageContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  // Responses for a thread the viewer has since left are dropped.
  const current = useRef(threadId);
  const lastMarked = useRef(0);
  // How to adjust the scroll position after the next render.
  const scrollIntent = useRef<'bottom' | { keepFrom: number } | null>(null);

  const lastId = messages.length ? messages[messages.length - 1].id : 0;

  const nearBottom = () => {
    const el = scroller.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_BOTTOM_PX;
  };

  const load = useCallback(async () => {
    current.current = threadId;
    lastMarked.current = 0;
    setLoading(true);
    setError(null);
    setMessages([]);
    setMember(null);
    try {
      const page = await api.messages.thread(threadId);
      if (current.current !== threadId) return;
      scrollIntent.current = 'bottom';
      setMessages(page.messages);
      setHasOlder(page.hasOlder);
      setOtherReadId(page.otherReadId);
      setMember(page.member);
    } catch (err) {
      if (current.current === threadId) setError(userMessage(err, "We couldn't load this conversation."));
    } finally {
      if (current.current === threadId) setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    load();
    setDraft('');
    setSendError(null);
  }, [load]);

  const poll = useCallback(async () => {
    if (loading || error) return;
    const id = threadId;
    const page = await api.messages.thread(id, { after: lastId });
    if (current.current !== id) return;
    if (page.messages.length) {
      if (nearBottom()) scrollIntent.current = 'bottom';
      setMessages((prev) => merge(prev, page.messages));
    }
    setOtherReadId(page.otherReadId);
  }, [threadId, lastId, loading, error]);
  usePolling(poll, THREAD_POLL_MS, !loading && !error);

  // Mark the newest message from the other side as read once it's on screen.
  const lastIncoming = [...messages].reverse().find((m) => !m.mine && m.fromMember === adminView);
  useEffect(() => {
    if (!lastIncoming || lastIncoming.id <= lastMarked.current) return;
    if (document.visibilityState !== 'visible') return;
    lastMarked.current = lastIncoming.id;
    const id = threadId;
    api.messages
      .markRead(id, lastIncoming.id)
      .then((counts) => {
        setCounts(counts);
        onActivity?.();
      })
      .catch(() => {
        if (current.current === id) lastMarked.current = 0; // retry on the next render
      });
  }, [lastIncoming, threadId, setCounts, onActivity]);

  useLayoutEffect(() => {
    const el = scroller.current;
    const intent = scrollIntent.current;
    if (!el || !intent) return;
    scrollIntent.current = null;
    el.scrollTop = intent === 'bottom' ? el.scrollHeight : el.scrollHeight - intent.keepFrom;
  }, [messages]);

  const loadOlder = async () => {
    const el = scroller.current;
    if (!messages.length || loadingOlder) return;
    const id = threadId;
    setLoadingOlder(true);
    try {
      const page = await api.messages.thread(id, { before: messages[0].id });
      if (current.current !== id) return;
      scrollIntent.current = { keepFrom: el ? el.scrollHeight - el.scrollTop : 0 };
      setMessages((prev) => [...page.messages, ...prev]);
      setHasOlder(page.hasOlder);
    } catch {
      // The button stays; the viewer can try again.
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    const id = threadId;
    setSending(true);
    setSendError(null);
    try {
      const message = await api.messages.send(id, body);
      if (current.current !== id) return;
      scrollIntent.current = 'bottom';
      setMessages((prev) => merge(prev, [message]));
      setDraft('');
      onActivity?.();
    } catch (err) {
      setSendError(userMessage(err, "Your message wasn't sent. Please try again."));
    } finally {
      setSending(false);
      composer.current?.focus();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const lastMine = [...messages].reverse().find((m) => m.mine);

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card',
        className
      )}
    >
      {header && (
        <div className="shrink-0 border-b border-line px-4 py-3 sm:px-5">
          {typeof header === 'function' ? header(member) : header}
        </div>
      )}

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-cream/60 px-3 py-4 sm:px-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-16 w-3/5" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-muted">No messages yet.</p>
            {emptyHint && <p className="mt-1.5 max-w-xs text-[13px] text-subtle">{emptyHint}</p>}
          </div>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {hasOlder && (
              <li className="mb-2 flex justify-center">
                <button
                  type="button"
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-muted transition-colors hover:text-ink disabled:opacity-60"
                >
                  {loadingOlder ? 'Loading…' : 'Load earlier messages'}
                </button>
              </li>
            )}
            {messages.map((message, i) => {
              const prev = messages[i - 1];
              const newDay = !prev || dayOf(prev.createdAt) !== dayOf(message.createdAt);
              const sameAuthor =
                prev && !newDay && prev.mine === message.mine && prev.fromMember === message.fromMember;
              return (
                <li key={message.id} className="contents">
                  {newDay && (
                    <div className="my-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.1em] text-subtle">
                      <span className="h-px flex-1 bg-line" />
                      {dayOf(message.createdAt)}
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  )}
                  <Bubble
                    message={message}
                    adminView={adminView}
                    otherLabel={otherLabel}
                    showLabel={!sameAuthor}
                    seen={message.id === lastMine?.id && otherReadId >= message.id}
                  />
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <form onSubmit={send} className="shrink-0 border-t border-line bg-white p-3 sm:p-4">
        {sendError && <p className="mb-2 text-[13px] text-dangerSoft">{sendError}</p>}
        <div className="flex items-end gap-2">
          <label htmlFor={`composer-${threadId}`} className="sr-only">
            Message
          </label>
          <textarea
            id={`composer-${threadId}`}
            ref={composer}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder="Write a message…"
            disabled={loading || !!error}
            className="max-h-36 min-h-[44px] flex-1 resize-none rounded-xl border border-line bg-cream px-4 py-2.5 text-[15px] text-ink placeholder:text-subtle focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-60 [field-sizing:content]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending || loading || !!error}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              'Send'
            )}
          </button>
        </div>
        <p className="mt-1.5 hidden text-[11px] text-subtle sm:block">Enter to send · Shift+Enter for a new line</p>
      </form>
    </section>
  );
}

function Bubble({
  message,
  adminView,
  otherLabel,
  showLabel,
  seen,
}: {
  message: ChatMessage;
  adminView: boolean;
  otherLabel: string;
  showLabel: boolean;
  seen: boolean;
}) {
  // In the admin view, the right-hand side is the admin team: the viewer's
  // own messages plus any a colleague (another super-admin) wrote.
  const right = adminView ? !message.fromMember : message.mine;
  const colleague = adminView && right && !message.mine;
  const fromMemberInAdminView = adminView && message.fromMember;

  const label = message.mine
    ? null
    : colleague
      ? message.sender
        ? `@${message.sender.handle}`
        : 'Former admin'
      : otherLabel;

  return (
    <div className={cn('flex flex-col', right ? 'items-end' : 'items-start', showLabel && 'mt-2')}>
      {showLabel && label && (
        <span
          className={cn(
            'mb-1 px-1 text-[11px] font-medium',
            fromMemberInAdminView ? 'text-amber-700' : 'text-muted'
          )}
        >
          {label}
        </span>
      )}
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed sm:max-w-[70%]',
          message.mine && 'rounded-br-md bg-brand-600 text-white',
          colleague && 'rounded-br-md border border-brand-200 bg-brand-50 text-ink',
          !right && 'rounded-bl-md border border-line bg-white text-ink',
          fromMemberInAdminView && 'border-l-[3px] border-l-gold'
        )}
      >
        {message.body}
      </div>
      <span className="mt-1 px-1 text-[10px] text-subtle">
        {timeOf(message.createdAt)}
        {seen && ' · Seen'}
      </span>
    </div>
  );
}
