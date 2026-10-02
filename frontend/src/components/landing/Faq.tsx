'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

const FAQS = [
  {
    q: 'What is MallHub?',
    a: 'MallHub is a final-year academic project that models a product-trading workflow: browsing a catalog, purchasing product lots, listing them for sale and recording each step in a ledger.',
  },
  {
    q: 'Is any real money involved?',
    a: 'No. Every balance, deposit, order and figure in this demo is simulated seed data. The platform does not accept, hold or pay out real funds.',
  },
  {
    q: 'Does MallHub guarantee profits?',
    a: 'No. Nothing in this project promises returns. Order margins shown in the demo are sample values set by an administrator to exercise the workflow.',
  },
  {
    q: 'What roles does the platform support?',
    a: 'Three: super-admins manage everything, sub-admins manage only the members, plans and products they created, and users work through their own order queue and ledger.',
  },
  {
    q: 'How are transactions tracked?',
    a: 'Every purchase, sale, adjustment and settlement is written to a per-user ledger, and admin actions are recorded in an audit log.',
  },
  {
    q: 'What is it built with?',
    a: 'A Next.js 15 and Tailwind CSS frontend, and an Express API backed by PostgreSQL with role-based authentication.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2.5">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="rounded-[10px] bg-[#EFEFEC]">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-[13px] text-ink sm:text-sm"
            >
              {item.q}
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <p className="animate-fade-up px-4 pb-4 text-[13px] leading-relaxed text-muted">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
