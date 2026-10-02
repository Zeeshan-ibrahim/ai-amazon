'use client';

import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from '@/components/ui/Icons';

/**
 * The admin panel's dialog, styled like the member `Modal`: bottom sheet under
 * `sm`, centered dialog above. Escape and the backdrop close it.
 */
export function AdminModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[94vh] w-full animate-fade-up flex-col overflow-hidden rounded-t-2xl bg-white shadow-modal sm:max-w-[660px] sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-7 sm:py-5">
          <h3 className="text-lg font-medium tracking-tight text-ink sm:text-xl">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-ink"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">{children}</div>
      </div>
    </div>
  );
}
