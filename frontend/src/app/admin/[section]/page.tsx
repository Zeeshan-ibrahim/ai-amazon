import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/ui/States';
import { adminNavItems } from '@/lib/nav';

/**
 * Placeholder for every admin section until its screen is built. A real page
 * at `app/admin/<slug>/page.tsx` takes precedence over this dynamic route.
 */
export const dynamicParams = false;

export const generateStaticParams = () =>
  adminNavItems.filter((item) => !item.built).map(({ slug }) => ({ section: slug }));

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const item = adminNavItems.find((i) => i.slug === section && !i.built);
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-medium tracking-tight text-ink">
        {item.title}
      </h1>
      <EmptyState
        title="This section hasn't been built yet."
        hint="Its screens and rules are next."
      />
    </div>
  );
}
