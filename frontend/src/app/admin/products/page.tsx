'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { ProductFormModal } from '@/components/admin/products/ProductFormModal';
import { AddedByBadge, AdminButton, AdminPageHeader, Notice } from '@/components/admin/ui';
import { useSession } from '@/components/layout/SessionProvider';
import { BagIcon, EditIcon, PlusIcon, TrashIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { usePagedList } from '@/hooks/usePagedList';
import { api, userMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { AdminProduct } from '@/lib/types';

/** Dialog state: closed, adding, or editing a product. */
type Editor = { open: false } | { open: true; product: AdminProduct | null };

export default function ProductsPage() {
  const { user } = useSession();
  const isSubAdmin = user?.role === 'sub_admin';
  const fetchPage = useCallback((offset: number) => api.admin.products({ offset }), []);
  const { items, total, loading, loadingMore, error, hasMore, loadMore, reload } =
    usePagedList<AdminProduct>(fetchPage);

  const [editor, setEditor] = useState<Editor>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const closeEditor = useCallback(() => setEditor({ open: false }), []);

  const remove = async (product: AdminProduct) => {
    if (
      !window.confirm(
        `Delete “${product.title}”? It leaves the catalog; members' existing orders are unaffected.`
      )
    ) {
      return;
    }
    setDeletingId(product.id);
    setActionError(null);
    try {
      await api.admin.deleteProduct(product.id);
      reload();
    } catch (err) {
      setActionError(userMessage(err, 'Could not delete this product.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Products"
        subtitle={
          isSubAdmin
            ? 'Your products, plus the shared catalog (read-only)'
            : 'Manage group investment options'
        }
        actions={
          <AdminButton
            onClick={() => setEditor({ open: true, product: null })}
            icon={<PlusIcon className="h-5 w-5" />}
            className="py-4"
          >
            Add product
          </AdminButton>
        }
      />

      {actionError && <Notice tone="error">{actionError}</Notice>}

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <ProductGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px] rounded-[28px]" />
          ))}
        </ProductGrid>
      ) : items.length === 0 ? (
        <EmptyState
          className="border-black/10"
          title="No products yet."
          hint="Add one to make it available for allocation to members."
        />
      ) : (
        <>
          <ProductGrid>
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                ownerLabel={
                  isSubAdmin ? (product.editable ? 'Yours' : 'Shared') : <AddedByBadge addedBy={product.addedBy} />
                }
                deleting={deletingId === product.id}
                onEdit={() => setEditor({ open: true, product })}
                onDelete={() => remove(product)}
              />
            ))}
          </ProductGrid>
          {hasMore && (
            <div className="text-center">
              <AdminButton variant="outline" size="sm" loading={loadingMore} onClick={loadMore}>
                Load more ({items.length} of {total})
              </AdminButton>
            </div>
          )}
        </>
      )}

      <ProductFormModal
        open={editor.open}
        product={editor.open ? editor.product : null}
        onClose={closeEditor}
        onSaved={() => {
          closeEditor();
          reload();
        }}
      />
    </div>
  );
}

function ProductGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{children}</div>;
}

/** "2.5" → "2.5%", "1.000" → "1%". */
const formatReturn = (value: number) => `${Number(value.toFixed(3))}%`;

function ProductCard({
  product,
  ownerLabel,
  deleting,
  onEdit,
  onDelete,
}: {
  product: AdminProduct;
  /** Who owns it: "Yours"/"Shared" for a sub-admin, the owner's badge for a super-admin. */
  ownerLabel: ReactNode;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.25)]">
      <div className="relative aspect-square bg-[#f7f7f7]">
        {product.image ? (
          // Plain <img>: admins paste images from any host, which next/image won't allow.
          <img
            src={product.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-black/15">
            <BagIcon className="h-16 w-16" />
          </div>
        )}
        <span className="absolute right-4 top-4 rounded-xl bg-[#1c1c1c] px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
          {formatReturn(product.profitPercentage)} return
        </span>
        <span className="absolute left-4 top-4">
          {typeof ownerLabel === 'string' ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
              {ownerLabel}
            </span>
          ) : (
            ownerLabel
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 pt-5">
        <h2 title={product.title} className="truncate text-[17px] font-black uppercase tracking-tight text-ink">
          {product.title}
        </h2>
        <p className="mt-1 text-[20px] font-black text-ink">{formatCurrency(product.price)}</p>

        {!product.editable ? (
          <p className="mt-auto pt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-subtle">
            Shared catalog · assign it from a member&apos;s Orders tab
          </p>
        ) : (
        <div className="mt-auto flex items-center gap-3 pt-6">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl border border-black/[0.05] bg-[#f7f7f7] py-3.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-black/[0.06]"
          >
            <EditIcon className="h-[18px] w-[18px]" />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={`Delete ${product.title}`}
            className="inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl bg-dangerSoft/10 text-dangerSoft transition-colors hover:bg-dangerSoft/20 disabled:opacity-50"
          >
            {deleting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <TrashIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        )}
      </div>
    </article>
  );
}
