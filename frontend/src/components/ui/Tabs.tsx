'use client';

import { cn } from '@/lib/cn';

export type TabItem = {
  id: string;
  label: string;
  badge?: string | number;
};

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn('flex gap-5 overflow-x-auto border-b border-line sm:gap-7', className)}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 pb-3 text-[15px] transition-colors',
              isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink'
            )}
          >
            {item.label}
            {item.badge != null && (
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'bg-black/5 text-muted'
                )}
              >
                {item.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-ink" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl({
  items,
  active,
  onChange,
  label,
}: {
  items: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.13em] text-subtle sm:block">
          {label}
        </span>
      )}
      <div className="flex gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'rounded-lg border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.09em] transition-colors',
              item.id === active
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-white text-muted hover:text-ink'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
