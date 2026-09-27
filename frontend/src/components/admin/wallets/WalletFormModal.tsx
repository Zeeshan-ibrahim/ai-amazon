'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminButton, AdminInput, Notice } from '@/components/admin/ui';
import { api, userMessage } from '@/lib/api';
import type { Wallet, WalletInput } from '@/lib/types';

const EMPTY: WalletInput = { coin: '', network: '', address: '' };

/** Add Wallet. Once saved, members can pick it in the Deposit Center. */
export function WalletFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (wallet: Wallet) => void;
}) {
  const [form, setForm] = useState<WalletInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError(null);
  }, [open]);

  const set = (key: keyof WalletInput) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const body = { coin: form.coin.trim(), network: form.network.trim(), address: form.address.trim() };
    if (!body.coin) return setError('Enter a coin, e.g. USDT.');
    if (!body.network) return setError('Enter a network, e.g. TRC20.');
    if (!body.address) return setError('Enter the wallet address.');

    setSaving(true);
    setError(null);
    try {
      onSaved(await api.admin.createWallet(body));
    } catch (err) {
      setError(userMessage(err, 'Could not save the wallet.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal open={open} onClose={onClose} title="Add wallet">
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <AdminInput
          tone="soft"
          label="Coin (e.g. USDT)"
          placeholder="USDT"
          autoCapitalize="characters"
          value={form.coin}
          onChange={(e) => set('coin')(e.target.value)}
        />
        <AdminInput
          tone="soft"
          label="Network"
          placeholder="TRC20"
          autoCapitalize="characters"
          value={form.network}
          onChange={(e) => set('network')(e.target.value)}
        />
        <AdminInput
          tone="soft"
          label="Wallet address"
          placeholder="T..."
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
          value={form.address}
          onChange={(e) => set('address')(e.target.value)}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <AdminButton type="submit" size="lg" loading={saving} className="w-full rounded-[22px] tracking-[0.2em]">
          Save wallet
        </AdminButton>
      </form>
    </AdminModal>
  );
}
