'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { BannerFormModal } from '@/components/admin/banners/BannerFormModal';
import { AdminButton, AdminPageHeader, Notice } from '@/components/admin/ui';
import { EditIcon, ImageIcon, PlusIcon, TrashIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api, userMessage } from '@/lib/api';
import type { Banner } from '@/lib/types';

/** Dialog state: closed, adding, or editing a banner. */
type Editor = { open: false } | { open: true; banner: Banner | null };

const fetchBanners = () => api.admin.banners();

export default function BannersPage() {
  const { data, loading, error, refetch } = useApi<Banner[]>(fetchBanners);

  const [editor, setEditor] = useState<Editor>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const closeEditor = useCallback(() => setEditor({ open: false }), []);

  const remove = async (banner: Banner) => {
    if (!window.confirm(`Delete “${banner.title}”? Members will no longer see it on their dashboard.`)) return;
    setDeletingId(banner.id);
    setActionError(null);
    try {
      await api.admin.deleteBanner(banner.id);
      await refetch();
    } catch (err) {
      setActionError(userMessage(err, 'Could not delete this banner.'));
    } finally {
      setDeletingId(null);
    }
  };

  const banners = data ?? [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Banners"
        subtitle="Control group promotional assets"
        actions={
          <AdminButton
            onClick={() => setEditor({ open: true, banner: null })}
            icon={<PlusIcon className="h-5 w-5" />}
            className="py-4"
          >
            Add banner
          </AdminButton>
        }
      />

      {actionError && <Notice tone="error">{actionError}</Notice>}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <BannerGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[360px] rounded-[36px]" />
          ))}
        </BannerGrid>
      ) : banners.length === 0 ? (
        <EmptyState
          className="border-black/10"
          title="No banners yet."
          hint="Add one to show it on every member's dashboard."
        />
      ) : (
        <BannerGrid>
          {banners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              deleting={deletingId === banner.id}
              onEdit={() => setEditor({ open: true, banner })}
              onDelete={() => remove(banner)}
            />
          ))}
        </BannerGrid>
      )}

      <BannerFormModal
        open={editor.open}
        banner={editor.open ? editor.banner : null}
        onClose={closeEditor}
        onSaved={() => {
          closeEditor();
          refetch();
        }}
      />
    </div>
  );
}

function BannerGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 md:grid-cols-2 xl:gap-8">{children}</div>;
}

function BannerCard({
  banner,
  deleting,
  onEdit,
  onDelete,
}: {
  banner: Banner;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[36px] border border-black/[0.07] bg-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.25)] transition-colors hover:bg-black/[0.03]">
      <div className="relative aspect-[16/9] bg-[#f7f7f7]">
        {banner.image ? (
          // Plain <img>: admins paste images from any host, which next/image won't allow.
          <img
            src={banner.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-black/15">
            <ImageIcon className="h-16 w-16" />
          </div>
        )}
        {/* Always visible on touch screens; revealed on hover or keyboard focus on desktop. */}
        <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/20 transition-opacity lg:bg-black/30 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${banner.title}`}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/85 text-ink backdrop-blur transition-colors hover:bg-white"
          >
            <EditIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={`Delete ${banner.title}`}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/85 text-dangerSoft backdrop-blur transition-colors hover:bg-white disabled:opacity-60"
          >
            {deleting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <TrashIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <div className="px-8 pb-8 pt-7">
        <h2 title={banner.title} className="truncate text-[20px] font-black uppercase tracking-tight text-ink">
          {banner.title}
        </h2>
        {banner.description && (
          <p
            title={banner.description}
            className="mt-1.5 truncate text-[12px] font-bold uppercase tracking-[0.16em] text-subtle"
          >
            {banner.description}
          </p>
        )}
      </div>
    </article>
  );
}
