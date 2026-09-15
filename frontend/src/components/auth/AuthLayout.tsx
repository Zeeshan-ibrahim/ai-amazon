import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { AuthHero } from './AuthHero';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FCFBF7] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="h-[280px] overflow-hidden rounded-b-3xl lg:h-auto lg:rounded-none">
        <AuthHero />
      </div>

      <div className="flex min-h-[calc(100vh-280px)] flex-col px-6 pb-8 pt-8 sm:px-10 lg:min-h-screen lg:justify-center lg:px-16">
        <div className="mx-auto w-full max-w-[420px] flex-1 lg:flex-none">
          <div className="mb-8 hidden flex-col items-center gap-2 lg:flex">
            <Logo stacked={false} className="flex-col gap-2 text-ink" markClassName="text-brand-600 h-9 w-14" />
          </div>

          <div className="text-center">
            <h1 className="text-[30px] font-medium tracking-tight text-ink sm:text-[34px]">
              {title}
            </h1>
            <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>
          </div>

          <div className="mt-8">{children}</div>

          <div className="mt-8 text-center text-[15px] text-muted">{footer}</div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-7 border-t border-line pt-5 text-[13px] text-muted lg:mt-16 lg:border-t-0">
          <Link href="/terms" className="transition-colors hover:text-ink">
            Terms of Service
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-ink">
            Privacy Policy
          </Link>
          <Link href="/contact" className="transition-colors hover:text-ink">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
