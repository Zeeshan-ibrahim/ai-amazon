import { SectionTitle } from '@/components/ui/Card';
import type { Capability } from '@/lib/types';

/**
 * Desktop-only band: section heading on the left, key/value pairs on the
 * right. Hidden on mobile, matching the mobile layout in the designs.
 */
export function CapabilitiesGrid({
  capabilities,
}: {
  capabilities: Capability[];
}) {
  return (
    <section className="hidden gap-8 border-t border-line pt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <SectionTitle>Trading commerce capabilities</SectionTitle>

      <div className="grid grid-cols-2 gap-x-8 gap-y-7">
        {capabilities.map((capability) => (
          <div key={capability.id}>
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-subtle">
              {capability.label}
            </p>
            <p className="mt-1.5 text-xl font-medium tracking-tight text-ink">
              {capability.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
