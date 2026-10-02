import { LogoMark } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark className={cn('shrink-0', markClassName)} />
      <span className="text-[17px] font-medium leading-[1.15] tracking-tight">MallHub</span>
    </div>
  );
}
