import type { ProductsPayload } from '@/lib/types';

export function OrderNotice({
  notice,
}: {
  notice: ProductsPayload['meta']['notice'];
}) {
  return (
    <section className="rounded-card bg-balance-veil p-5 text-white shadow-panel sm:p-6">
      <div className="lg:flex lg:items-center lg:gap-6">
        <div className="lg:flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-brand-300">
            {notice.eyebrow}
          </p>
          <h3 className="mt-2 text-xl font-medium tracking-tight sm:text-[22px]">
            {notice.title}
          </h3>
          <p className="mt-2.5 text-[13px] text-white/70 sm:text-sm">
            &ldquo;{notice.quote}&rdquo;
          </p>
        </div>

        <p className="mt-4 border-t border-white/10 pt-4 text-[12px] leading-relaxed text-white/50 lg:mt-0 lg:w-[210px] lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          {notice.footnote}
        </p>
      </div>
    </section>
  );
}
