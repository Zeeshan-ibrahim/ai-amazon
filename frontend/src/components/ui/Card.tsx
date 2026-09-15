import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
  tone?: 'default' | 'muted' | 'dark';
};

const tones = {
  default: 'bg-surface border-line',
  muted: 'bg-[#F4F3EE] border-transparent',
  dark: 'border-white/10 bg-balance-veil text-white',
};

export function Card({
  padded = true,
  tone = 'default',
  className,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-card border shadow-card',
        tones[tone],
        padded && 'p-5 sm:p-6',
        className
      )}
    />
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn('text-xl font-medium tracking-tight text-ink sm:text-[22px]', className)}>
      {children}
    </h2>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-[10px] font-medium uppercase tracking-[0.14em] text-subtle',
        className
      )}
    >
      {children}
    </p>
  );
}
