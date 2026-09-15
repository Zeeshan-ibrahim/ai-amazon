import Link from 'next/link';
import { Card, Eyebrow } from '@/components/ui/Card';
import { BoxIcon, PlanIcon } from '@/components/ui/Icons';
import type { Tutorial } from '@/lib/types';

export function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Card className="flex h-full flex-col">
      <Eyebrow className="text-brand-600">{tutorial.eyebrow}</Eyebrow>
      <h3 className="mt-2.5 text-[15px] font-medium text-ink sm:text-base">
        {tutorial.title}
      </h3>
      <p className="mt-2.5 text-[13px] leading-relaxed text-muted sm:line-clamp-4">
        {tutorial.body}
      </p>

      {/* Mobile-only shortcuts — desktop navigates from the sidebar. */}
      <div className="mt-5 grid gap-2.5 lg:hidden">
        <Link
          href="/products"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-balance-veil text-sm font-medium text-white"
        >
          <BoxIcon className="h-4 w-4" />
          Start Trading Items
        </Link>
        <Link
          href="/plans"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-medium text-ink"
        >
          <PlanIcon className="h-4 w-4" />
          View Partner Plans
        </Link>
      </div>
    </Card>
  );
}
