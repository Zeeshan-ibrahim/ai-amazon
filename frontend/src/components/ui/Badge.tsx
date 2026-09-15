import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'green' | 'dark' | 'outline';

const tones: Record<Tone, string> = {
  neutral: 'bg-black/5 text-muted',
  green: 'bg-brand-50 text-brand-600',
  dark: 'bg-brand-500 text-white',
  outline: 'border border-line bg-white text-muted',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em]',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
