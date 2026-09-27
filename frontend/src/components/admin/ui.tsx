/**
 * Admin panel primitives. The admin look is its own: heavy uppercase type,
 * black + gold actions, big rounded cards, monospace money and codes.
 */
'use client';

import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';
import type { Role } from '@/lib/types';

/* ------------------------------------------------------------- layout */

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-black/[0.06] pb-7 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-black uppercase leading-none tracking-tight text-ink sm:text-[34px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-[12px] font-bold uppercase leading-relaxed tracking-[0.18em] text-subtle">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div>}
    </header>
  );
}

export function AdminCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        'rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.25)] sm:p-7',
        className
      )}
    >
      {children}
    </section>
  );
}

/**
 * Marks UI built without a reference design, so it's easy to find and
 * restyle when the screenshots arrive.
 */
export function PicturesNeeded({ what }: { what: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-dashed border-amber-500/60 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pictures needed · {what}
    </p>
  );
}

/* ------------------------------------------------------------ buttons */

type ButtonVariant = 'primary' | 'dark' | 'outline' | 'danger' | 'success';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-black text-gold shadow-[0_12px_24px_-14px_rgba(0,0,0,0.8)] hover:bg-black/85',
  dark: 'bg-[#1c1c1c] text-gold hover:bg-black',
  outline: 'border border-black/15 bg-white text-ink hover:border-black/40',
  danger: 'border border-dangerSoft/30 bg-dangerSoft/5 text-dangerSoft hover:bg-dangerSoft/10',
  success: 'border border-money/30 bg-money/5 text-money hover:bg-money/10',
};

export function AdminButton({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2.5 rounded-2xl font-extrabold uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'px-4 py-2.5 text-[11px]',
        size === 'md' && 'px-6 py-3.5 text-[12px]',
        size === 'lg' && 'px-6 py-5 text-[13px]',
        buttonVariants[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

/**
 * One tab in a pill switcher (Financials, Plan Requests). `dark` is the
 * black/gold primary filter, `gold` the secondary one; `badge` shows a count.
 */
export function Segment({
  active,
  tone,
  badge,
  onClick,
  children,
}: {
  active: boolean;
  tone: 'dark' | 'gold';
  badge?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.16em] transition-colors sm:flex-none sm:px-8',
        active
          ? tone === 'dark'
            ? 'bg-black text-gold shadow-[0_10px_20px_-12px_rgba(0,0,0,0.8)]'
            : 'bg-gold text-ink shadow-[0_10px_20px_-12px_rgba(217,180,90,0.9)]'
          : 'text-subtle hover:text-ink'
      )}
    >
      {children}
      {badge ? (
        <span
          className={cn(
            'min-w-[22px] rounded-full px-1.5 py-0.5 text-[11px] tracking-normal',
            active ? 'bg-gold text-ink' : 'bg-black text-gold'
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

/* ------------------------------------------------------------- fields */

const fieldShape =
  'w-full rounded-2xl px-5 py-4 text-[16px] font-semibold text-ink placeholder:font-medium placeholder:text-subtle focus:bg-white focus:outline-none focus:ring-4 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-60';

/** `outlined` for member forms, `soft` for the lighter modal forms (products). */
type FieldTone = 'outlined' | 'soft';

const fieldTones: Record<FieldTone, string> = {
  outlined: 'border-[1.5px] border-black/80 bg-[#fafafa] focus:border-black',
  soft: 'border border-black/[0.05] bg-[#f7f7f7] focus:border-black/30',
};

const fieldBase = `${fieldShape} ${fieldTones.outlined}`;

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2.5 block pl-2 text-[11px] font-bold uppercase tracking-[0.16em] text-subtle"
    >
      {children}
    </label>
  );
}

export const AdminInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    hint?: string;
    prefix?: string;
    tone?: FieldTone;
  }
>(function AdminInput({ label, hint, prefix, tone = 'outlined', className, id, ...props }, ref) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="w-full">
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[16px] font-semibold text-ink">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldShape, fieldTones[tone], prefix && 'pl-10', className)}
          {...props}
        />
      </div>
      {hint && <p className="mt-2 pl-2 text-[12px] text-subtle">{hint}</p>}
    </div>
  );
});

export function AdminTextarea({
  label,
  hint,
  tone = 'outlined',
  id,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; tone?: FieldTone }) {
  const generated = useId();
  const textareaId = id ?? generated;
  return (
    <div className="w-full">
      <FieldLabel htmlFor={textareaId}>{label}</FieldLabel>
      <textarea
        id={textareaId}
        className={cn(fieldShape, fieldTones[tone], 'min-h-[120px] resize-y leading-relaxed', className)}
        {...props}
      />
      {hint && <p className="mt-2 pl-2 text-[12px] text-subtle">{hint}</p>}
    </div>
  );
}

export function AdminSelect({
  label,
  hint,
  id,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <div className="w-full">
      <FieldLabel htmlFor={selectId}>{label}</FieldLabel>
      <div className="relative">
        <select id={selectId} className={cn(fieldBase, 'appearance-none pr-12', className)} {...props}>
          {children}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {hint && <p className="mt-2 pl-2 text-[12px] text-subtle">{hint}</p>}
    </div>
  );
}

/** Uppercase search box used in page headers and the allocation hub. */
export function AdminSearch({
  value,
  onChange,
  placeholder,
  className,
  tone = 'caps',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  tone?: 'caps' | 'plain';
}) {
  return (
    <label className={cn('relative block', className)}>
      <span className="sr-only">{placeholder}</span>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/70"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20.5 20.5-4.5-4.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-2xl border border-black/10 bg-white py-4 pl-14 pr-5 text-[15px] font-semibold text-ink focus:border-black/40 focus:outline-none focus:ring-4 focus:ring-gold/20',
          tone === 'caps'
            ? 'placeholder:text-[13px] placeholder:font-bold placeholder:uppercase placeholder:tracking-[0.14em] placeholder:text-subtle'
            : 'placeholder:font-medium placeholder:text-subtle'
        )}
      />
    </label>
  );
}

/* ---------------------------------------------------------- identity */

export function RoleBadge({ role, outlined }: { role: Role; outlined?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em]',
        outlined ? 'border border-black/10 bg-white text-ink' : 'bg-black/[0.04] text-subtle',
        role === 'admin' && 'bg-gold/15 text-[#8a6a1f]'
      )}
    >
      {role}
    </span>
  );
}

/** Black disc with the member's initial in gold. */
export function MemberInitial({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-black font-black text-gold',
        size === 'md' ? 'h-14 w-14 text-[18px]' : 'h-16 w-16 bg-[#1c1c1c] text-[22px] ring-1 ring-gold/40 sm:h-[76px] sm:w-[76px]'
      )}
    >
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}

/* ------------------------------------------------------------ status */

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success' | 'warn'; children: ReactNode }) {
  return (
    <p
      className={cn(
        'rounded-2xl px-4 py-3 text-[13px] font-medium',
        tone === 'info' && 'bg-black/[0.04] text-ink/80',
        tone === 'error' && 'bg-dangerSoft/10 text-dangerSoft',
        tone === 'success' && 'bg-money/10 text-money',
        tone === 'warn' && 'border border-amber-500/30 bg-amber-50 text-amber-800'
      )}
    >
      {children}
    </p>
  );
}
