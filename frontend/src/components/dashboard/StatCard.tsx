import { Card } from '@/components/ui/Card';
import { BarsIcon, BoxIcon, FlameIcon } from '@/components/ui/Icons';
import { formatStat } from '@/lib/format';
import type { Stat } from '@/lib/types';

const icons = {
  flame: FlameIcon,
  bars: BarsIcon,
  box: BoxIcon,
};

export function StatCard({ stat }: { stat: Stat }) {
  const Icon = icons[stat.icon];

  return (
    <Card className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
      <div>
        <p className="tabular text-[22px] font-medium tracking-tight text-ink sm:text-[26px]">
          {formatStat(stat.value, stat.format)}
        </p>
        <p className="mt-0.5 text-[13px] text-muted">{stat.label}</p>
      </div>
      <Icon className="h-7 w-7 shrink-0 text-black/12" />
    </Card>
  );
}
