'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { LedgerEntry } from '@/lib/types';

/** Shows an uploaded payment receipt. The image loads straight from the API with the admin's cookie. */
export function ReceiptViewer({ entry, onClose }: { entry: LedgerEntry; onClose: () => void }) {
  const [failed, setFailed] = useState(false);
  const url = api.admin.receiptUrl(entry.id);

  return (
    <Modal
      open
      onClose={onClose}
      title="Payment receipt"
      subtitle={`${formatCurrency(entry.amount)} · ${[entry.coin, entry.network].filter(Boolean).join(' ')}`}
      size="lg"
    >
      {failed ? (
        <p className="py-10 text-center text-sm text-muted">This receipt could not be loaded.</p>
      ) : (
        // Plain <img>: next/image can't forward the session cookie to the API.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`Receipt${entry.receiptName ? ` ${entry.receiptName}` : ''}`}
          onError={() => setFailed(true)}
          className="mx-auto max-h-[70vh] w-auto rounded-2xl border border-black/10"
        />
      )}
      <div className="mt-4 flex items-center justify-between gap-3 text-[12px] text-subtle">
        <span className="truncate">{entry.receiptName}</span>
        <a href={url} target="_blank" rel="noreferrer" className="shrink-0 font-bold text-ink underline underline-offset-4">
          Open original
        </a>
      </div>
    </Modal>
  );
}
