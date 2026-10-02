/**
 * Admin panel primitives. They share the member app's design language
 * (docs/design-system.md): cream page, white `line` cards, ink primary
 * actions, brand-green accents, medium-weight type.
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
import type { AddedBy, Role } from '@/lib/types';

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
    <header className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-medium leading-tight tracking-tight text-ink lg:text-[30px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
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
        'rounded-card border border-line bg-surface p-5 shadow-card sm:p-6',
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
    <p className="inline-flex items-center gap-2 rounded-md border border-dashed border-amber-500/60 bg-amber-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pictures needed · {what}
    </p>
  );
}

/* ------------------------------------------------------------ buttons */

type ButtonVariant = 'primary' | 'dark' | 'outline' | 'danger' | 'success';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-black/85',
  dark: 'bg-brand-600 text-white hover:bg-brand-700',
  outline: 'border border-line bg-white text-ink hover:border-ink/25 hover:bg-cream',
  danger: 'border border-dangerSoft/25 bg-dangerSoft/5 text-dangerSoft hover:bg-dangerSoft/10',
  success: 'border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100',
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
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' && 'h-9 px-3.5 text-[13px]',
        size === 'md' && 'h-11 px-5 text-sm',
        size === 'lg' && 'h-[52px] px-6 text-[15px]',
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
 * primary (ink) filter, `gold` the secondary (brand) one; `badge` shows a count.
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
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm transition-colors sm:flex-none sm:px-6',
        active
          ? tone === 'dark'
            ? 'bg-ink font-medium text-white'
            : 'bg-brand-500 font-medium text-white'
          : 'text-muted hover:text-ink'
      )}
    >
      {children}
      {badge ? (
        <span
          className={cn(
            'min-w-[20px] rounded-md px-1.5 py-0.5 text-[11px] font-medium',
            active ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'
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
  'w-full rounded-xl px-4 py-3.5 text-[15px] text-ink placeholder:text-subtle transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60';

/** `outlined` for member forms, `soft` for the lighter modal forms (products). */
type FieldTone = 'outlined' | 'soft';

const fieldTones: Record<FieldTone, string> = {
  outlined: 'border border-line bg-white',
  soft: 'border border-line bg-cream',
};

const fieldBase = `${fieldShape} ${fieldTones.outlined}`;

/** `aside` sits at the right end of the label row, e.g. a size hint. */
function FieldLabel({ htmlFor, aside, children }: { htmlFor: string; aside?: ReactNode; children: ReactNode }) {
  const label = (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[13px] font-medium text-ink/80"
    >
      {children}
    </label>
  );
  if (!aside) return label;
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
      {label}
      <div className="mb-2">{aside}</div>
    </div>
  );
}

export const AdminInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    labelAside?: ReactNode;
    hint?: string;
    prefix?: string;
    tone?: FieldTone;
  }
>(function AdminInput({ label, labelAside, hint, prefix, tone = 'outlined', className, id, ...props }, ref) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="w-full">
      <FieldLabel htmlFor={inputId} aside={labelAside}>
        {label}
      </FieldLabel>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldShape, fieldTones[tone], prefix && 'pl-8', className)}
          {...props}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-subtle">{hint}</p>}
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
      {hint && <p className="mt-1.5 text-xs text-subtle">{hint}</p>}
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
        <select id={selectId} className={cn(fieldBase, 'appearance-none pr-11', className)} {...props}>
          {children}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {hint && <p className="mt-1.5 text-xs text-subtle">{hint}</p>}
    </div>
  );
}

/** Search box used in page headers and the allocation hub. */
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
        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
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
          'h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-sm text-ink transition-colors placeholder:text-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15',
          tone === 'caps' && 'placeholder:text-[13px]'
        )}
      />
    </label>
  );
}

/* ---------------------------------------------------------- identity */

export const ROLE_LABELS: Record<Role, string> = {
  user: 'User',
  sub_admin: 'Sub-admin',
  super_admin: 'Super-admin',
};

export function RoleBadge({ role, outlined }: { role: Role; outlined?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em]',
        role === 'super_admin'
          ? 'bg-brand-500 text-white'
          : role === 'sub_admin'
            ? 'bg-brand-50 text-brand-600'
            : outlined
              ? 'border border-line bg-white text-muted'
              : 'bg-black/5 text-muted'
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

export function AccountStatusBadge({ status }: { status: 'active' | 'suspended' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em]',
        status === 'active' ? 'bg-brand-50 text-brand-600' : 'bg-dangerSoft/10 text-dangerSoft'
      )}
    >
      {status}
    </span>
  );
}

/** Who owns a record: a sub-admin's handle, or the super-admin. */
export function AddedByBadge({ addedBy, className }: { addedBy: AddedBy; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em]',
        addedBy ? 'bg-black/5 text-muted' : 'bg-brand-50 text-brand-600',
        className
      )}
    >
      {addedBy ? `@${addedBy.handle}` : 'Super-admin'}
    </span>
  );
}

/** Brand disc with the member's initial. */
export function MemberInitial({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-medium text-brand-600',
        size === 'md' ? 'h-12 w-12 text-[17px]' : 'h-16 w-16 text-[22px] ring-1 ring-brand-200 sm:h-[72px] sm:w-[72px]'
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
        'rounded-xl px-4 py-3 text-[13px]',
        tone === 'info' && 'bg-[#F4F3EE] text-ink/80',
        tone === 'error' && 'bg-dangerSoft/10 text-dangerSoft',
        tone === 'success' && 'bg-brand-50 text-brand-600',
        tone === 'warn' && 'border border-amber-500/30 bg-amber-50 text-amber-800'
      )}
    >
      {children}
    </p>
  );
}
