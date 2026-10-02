'use client';

import { ChatThread } from '@/components/messages/ChatThread';
import { ChatIcon } from '@/components/ui/Icons';

/**
 * The trader's conversation with their account team — their sub-admin, or
 * the super-admin. Who that is stays hidden (docs/roles.md), so the other
 * side is just "Support".
 */
export default function MessagesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-medium tracking-tight text-ink lg:text-[30px]">Messages</h1>
        <p className="mt-1 text-sm text-muted">Questions about your account? Message our support team.</p>
      </div>

      <ChatThread
        threadId="me"
        otherLabel="Support"
        emptyHint="Send a message and our team will reply here."
        className="h-[calc(100dvh-300px)] min-h-[420px] lg:h-[calc(100dvh-250px)]"
        header={
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ChatIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[15px] font-medium text-ink">Support team</p>
              <p className="text-[12px] text-muted">Replies appear here</p>
            </div>
          </div>
        }
      />
    </div>
  );
}
