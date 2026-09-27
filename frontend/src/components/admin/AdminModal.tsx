'use client';

import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from '@/components/ui/Icons';

/**
 * The admin panel's dialog: a big rounded white sheet with a heavy uppercase
 * title and a round close button. Escape and the backdrop close it.
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
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[94vh] w-full animate-fade-up flex-col overflow-hidden rounded-t-[32px] bg-white shadow-modal sm:max-w-[640px] sm:rounded-[40px]"
      >
        <header className="flex items-center justify-between gap-4 px-6 pb-2 pt-7 sm:px-11 sm:pt-11">
          <h3 className="text-[24px] font-black uppercase leading-none tracking-tight text-ink sm:text-[28px]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/[0.05] bg-[#f7f7f7] text-subtle transition-colors hover:bg-black/[0.06] hover:text-ink"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5 sm:px-11 sm:pb-11">{children}</div>
      </div>
    </div>
  );
}
