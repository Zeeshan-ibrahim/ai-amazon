'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { EyeIcon, EyeOffIcon } from './Icons';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
};

export function Input({
  label,
  hint,
  error,
  prefix,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-[13px] font-medium text-ink/80"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
            {prefix}
          </span>
        )}
        <input
          {...props}
          id={inputId}
          className={cn(
            'h-[52px] w-full rounded-xl border border-line bg-white text-[15px] text-ink',
            'placeholder:text-subtle transition-colors',
            'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15',
            prefix ? 'pl-8 pr-4' : 'px-4',
            error && 'border-dangerSoft focus:border-dangerSoft focus:ring-dangerSoft/15',
            className
          )}
        />
      </div>
      {(error || hint) && (
        <p
          className={cn(
            'mt-1.5 text-xs',
            error ? 'text-dangerSoft' : 'text-subtle'
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function PasswordInput({ label, error, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        label={label}
        error={error}
        type={visible ? 'text' : 'password'}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className={cn(
          'absolute right-4 text-muted transition-colors hover:text-ink',
          label ? 'top-[46px]' : 'top-1/2 -translate-y-1/2'
        )}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
