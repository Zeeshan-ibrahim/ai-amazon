import { LogoMark } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';

export function Logo({
  className,
  stacked = true,
  markClassName,
}: {
  className?: string;
  stacked?: boolean;
  markClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark className={cn('shrink-0', markClassName)} />
      <span
        className={cn(
          'font-medium leading-[1.15] tracking-tight',
          stacked ? 'max-w-[92px] text-[17px]' : 'text-[17px]'
        )}
      >
        Quick On Amazon
      </span>
    </div>
  );
}
