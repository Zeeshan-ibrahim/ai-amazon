'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { WalletFormModal } from '@/components/admin/wallets/WalletFormModal';
import { AdminButton, AdminCard, AdminInput, AdminPageHeader, Notice } from '@/components/admin/ui';
import { ChatIcon, CheckIcon, CopyIcon, PlusIcon, SaveIcon, TrashIcon, WalletIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { useCopy } from '@/hooks/useCopy';
import { api, userMessage } from '@/lib/api';
import type { Settings, Wallet } from '@/lib/types';

const fetchWallets = () => api.admin.wallets();

export default function WalletsPage() {
  const { data, loading, error, refetch } = useApi<Wallet[]>(fetchWallets);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const remove = async (wallet: Wallet) => {
    if (
      !window.confirm(
        `Delete this ${wallet.coin} ${wallet.network} wallet? Members can no longer pick it for deposits; past deposits keep their record.`
      )
    ) {
      return;
    }
    setDeletingId(wallet.id);
    setActionError(null);
    try {
      await api.admin.deleteWallet(wallet.id);
      await refetch();
    } catch (err) {
      setActionError(userMessage(err, 'Could not delete this wallet.'));
    } finally {
      setDeletingId(null);
    }
  };

  const wallets = data ?? [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <AdminPageHeader
        title="Wallets & Support"
        subtitle="Manage group payment addresses and support links"
        actions={
          <AdminButton onClick={() => setAdding(true)} icon={<PlusIcon className="h-[18px] w-[18px]" />}>
            Add wallet
          </AdminButton>
        }
      />

      <SupportSettings />

      {actionError && <Notice tone="error">{actionError}</Notice>}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[260px] rounded-card" />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <EmptyState
          title="No wallets yet."
          hint="Members can't make deposits until you add at least one."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              deleting={deletingId === wallet.id}
              onDelete={() => remove(wallet)}
            />
          ))}
        </div>
      )}

      <WalletFormModal
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={() => {
          setAdding(false);
          refetch();
        }}
      />
    </div>
  );
}

const fetchSettings = () => api.admin.settings();

/** Telegram support link and the global withdrawal limit, saved together. */
function SupportSettings() {
  const { data, error, refetch } = useApi<Settings>(fetchSettings);
  const [url, setUrl] = useState('');
  const [limit, setLimit] = useState('0');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!data) return;
    setUrl(data.telegramSupportUrl ?? '');
    setLimit(String(data.globalWithdrawalLimit));
  }, [data]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!(Number(limit) >= 0)) return setNotice({ tone: 'error', text: 'Withdrawal limit must be 0 or more.' });
    setSaving(true);
    setNotice(null);
    try {
      await api.admin.saveSettings({ telegramSupportUrl: url.trim() || null, globalWithdrawalLimit: Number(limit) });
      setNotice({ tone: 'success', text: 'Settings saved.' });
    } catch (err) {
      setNotice({ tone: 'error', text: userMessage(err, 'Could not save the settings.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard>
      <div className="flex items-center gap-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ChatIcon className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-xl font-medium tracking-tight text-ink sm:text-[22px]">
            Support configuration
          </h2>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
            Set your Telegram support link
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-8">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <AdminInput
            tone="soft"
            label="Telegram support link"
            type="url"
            placeholder="https://t.me/your_support"
            value={url}
            disabled={!data}
            onChange={(e) => setUrl(e.target.value)}
          />
          <AdminInput
            tone="soft"
            label="Global withdrawal limit (USD)"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={limit}
            disabled={!data}
            onChange={(e) => setLimit(e.target.value)}
          />
          <AdminButton
            type="submit"
            size="lg"
            loading={saving}
            disabled={!data}
            icon={<SaveIcon className="h-5 w-5" />}
            className="px-8"
          >
            Save settings
          </AdminButton>
          <p className="text-[12px] text-subtle lg:col-span-3">
            Banners on members&apos; dashboards open this link. The limit applies per withdrawal to members without their
            own limit; 0 = no limit.
          </p>
          {notice && (
            <div className="lg:col-span-3">
              <Notice tone={notice.tone}>{notice.text}</Notice>
            </div>
          )}
        </form>
      )}
    </AdminCard>
  );
}

function WalletCard({ wallet, deleting, onDelete }: { wallet: Wallet; deleting: boolean; onDelete: () => void }) {
  const { copied, copy } = useCopy();
  return (
    <article className="rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <WalletIcon className="h-6 w-6" />
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Delete ${wallet.coin} ${wallet.network} wallet`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-dangerSoft/15 bg-white text-dangerSoft transition-colors hover:bg-dangerSoft/10 disabled:opacity-50"
        >
          {deleting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <TrashIcon className="h-[18px] w-[18px]" />
          )}
        </button>
      </header>

      <h2 className="mt-5 text-xl font-medium tracking-tight text-ink">{wallet.coin}</h2>
      <p className="mt-0.5 text-[13px] text-muted">{wallet.network}</p>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-cream py-3.5 pl-5 pr-3">
        <span title={wallet.address} className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink/70">
          {wallet.address}
        </span>
        <button
          type="button"
          onClick={() => copy(wallet.address)}
          aria-label="Copy wallet address"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-black/[0.05] hover:text-ink"
        >
          {copied ? <CheckIcon className="h-[18px] w-[18px] text-money" /> : <CopyIcon className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </article>
  );
}
