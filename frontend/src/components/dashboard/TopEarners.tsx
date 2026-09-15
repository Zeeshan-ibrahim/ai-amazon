import Image from 'next/image';
import { Card, SectionTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import type { TopEarner } from '@/lib/types';

export function TopEarners({ earners }: { earners: TopEarner[] }) {
  return (
    <section>
      <SectionTitle>Top earners</SectionTitle>
      <p className="mt-2 flex items-center gap-2 text-[12px] text-muted lg:order-last lg:mt-4">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-500" />
        Live Arbitrage Network Feed
      </p>

      <div className="mt-4 grid gap-3 lg:mt-5 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-line lg:overflow-hidden lg:rounded-card lg:border lg:border-line lg:bg-white lg:shadow-card">
        {earners.map((earner) => (
          <Card
            key={earner.rank}
            className="lg:rounded-none lg:border-0 lg:shadow-none"
          >
            <p className="text-[11px] tracking-[0.12em] text-subtle">
              {earner.rank}
            </p>

            <div className="mt-3 flex items-center gap-3">
              <Image
                src={earner.avatar}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-ink">
                  {earner.name}
                </p>
                <p className="truncate text-[12px] text-muted">{earner.title}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 lg:mt-5 lg:block lg:border-0 lg:pt-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-subtle">
                Earned
              </p>
              <p className="tabular text-lg font-medium text-money lg:mt-1 lg:text-xl">
                {formatCurrency(earner.earned)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
