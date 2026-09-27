'use client';

import { useCallback, useRef, useState, type FormEvent } from 'react';
import { AdminButton, AdminCard, AdminInput, AdminPageHeader, AdminSelect, Notice } from '@/components/admin/ui';
import { useSession } from '@/components/layout/SessionProvider';
import { CopyIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { useCopy } from '@/hooks/useCopy';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateTime, formatSignedCurrency } from '@/lib/format';
import type { AdminBalance, Transaction, Wallet } from '@/lib/types';

const MIN_DEPOSIT = 10;

const fetchBalance = () => api.admin.balance();

type Result = { tone: 'success' | 'error'; text: string } | null;

/**
 * A sub-admin's own balance (sub-admin only, see lib/nav.ts). Deposits and
 * withdrawals are requests: the balance moves only once a super-admin
 * approves them in Financials.
 */
export default function BalancePage() {
  const { refresh: refreshSession } = useSession();
  const { data, loading, error, refetch } = useApi<AdminBalance>(fetchBalance);

  const changed = useCallback(async () => {
    await Promise.all([refetch(), refreshSession()]);
  }, [refetch, refreshSession]);

  if (loading && !data) return <LoadingBlock rows={3} />;
  if (error || !data) return <ErrorState message={error ?? 'Balance unavailable.'} onRetry={refetch} />;

  const pending = data.transactions.filter((t) => t.status === 'PENDING');

  return (
    <div className="space-y-8">
      <AdminPageHeader title="My balance" subtitle="Deposits and withdrawals are approved by a super-admin" />

      <section className="flex flex-col gap-2 rounded-[40px] bg-black px-8 py-9 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.9)] sm:px-12 sm:py-11">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-gold">Available balance</p>
        <p className="break-words text-[40px] font-black leading-tight tracking-tight text-white sm:text-[52px]">
          {formatCurrency(data.balance)}
        </p>
        {pending.length > 0 && (
          <p className="text-[12px] font-semibold text-white/60">
            {pending.length} request{pending.length === 1 ? '' : 's'} awaiting super-admin approval
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DepositForm wallets={data.wallets} onDone={changed} />
        <WithdrawForm balance={data.balance} onDone={changed} />
      </div>

      <AdminCard>
        <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-subtle">History</h2>
        <div className="mt-4">
          {data.transactions.length === 0 ? (
            <EmptyState title="No requests yet." />
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {data.transactions.map((tx) => (
                <HistoryRow key={tx.id} tx={tx} />
              ))}
            </ul>
          )}
        </div>
      </AdminCard>
    </div>
  );
}

function DepositForm({ wallets, onDone }: { wallets: Wallet[]; onDone: () => Promise<void> }) {
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { copied, copy } = useCopy();
  const wallet = wallets.find((w) => w.id === walletId);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!receipt) return;
    setSaving(true);
    setResult(null);
    const form = new FormData();
    form.set('amount', amount);
    form.set('walletId', walletId);
    form.set('receipt', receipt);
    try {
      await api.admin.requestDeposit(form);
      setAmount('');
      setReceipt(null);
      if (fileInput.current) fileInput.current.value = '';
      setResult({ tone: 'success', text: 'Deposit request sent. It will show here once a super-admin reviews it.' });
      await onDone();
    } catch (err) {
      setResult({ tone: 'error', text: userMessage(err, 'Could not send the deposit request.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard>
      <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-subtle">Request deposit</h2>
      <p className="mt-1 text-[13px] text-muted">Pay into a listed wallet, then upload the receipt.</p>
      {wallets.length === 0 ? (
        <div className="mt-5">
          <Notice tone="warn">No payment wallets are listed yet. Ask a super-admin to add one.</Notice>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-5" noValidate>
          <AdminSelect label="Pay into" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.coin} · {w.network}
              </option>
            ))}
          </AdminSelect>
          {wallet && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/[0.04] px-5 py-4">
              <span className="min-w-0 break-all font-mono text-[13px] font-semibold text-ink">{wallet.address}</span>
              <button
                type="button"
                onClick={() => copy(wallet.address)}
                aria-label="Copy address"
                className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink"
              >
                {copied ? 'Copied' : <CopyIcon className="h-5 w-5" />}
              </button>
            </div>
          )}
          <AdminInput
            label="Amount (USD)"
            type="number"
            min={MIN_DEPOSIT}
            step="0.01"
            hint={`Minimum $${MIN_DEPOSIT}.`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div>
            <label
              htmlFor="deposit-receipt"
              className="mb-2.5 block pl-2 text-[11px] font-bold uppercase tracking-[0.16em] text-subtle"
            >
              Receipt screenshot
            </label>
            <input
              id="deposit-receipt"
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              className="block w-full rounded-2xl border-[1.5px] border-dashed border-black/30 bg-[#fafafa] px-5 py-4 text-[14px] text-ink file:mr-4 file:rounded-xl file:border-0 file:bg-black file:px-4 file:py-2 file:text-[11px] file:font-extrabold file:uppercase file:tracking-[0.14em] file:text-gold"
            />
            <p className="mt-2 pl-2 text-[12px] text-subtle">JPG, PNG or WEBP, up to 5MB.</p>
          </div>
          {result && <Notice tone={result.tone}>{result.text}</Notice>}
          <AdminButton
            type="submit"
            loading={saving}
            disabled={!(Number(amount) >= MIN_DEPOSIT) || !receipt || !walletId}
            className="w-full"
          >
            Send deposit request
          </AdminButton>
        </form>
      )}
    </AdminCard>
  );
}

function WithdrawForm({ balance, onDone }: { balance: number; onDone: () => Promise<void> }) {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const value = Number(amount);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      await api.admin.requestWithdrawal({ amount: value, address: address.trim() });
      setAmount('');
      setAddress('');
      setResult({ tone: 'success', text: 'Withdrawal request sent. Your balance changes once a super-admin approves it.' });
      await onDone();
    } catch (err) {
      setResult({ tone: 'error', text: userMessage(err, 'Could not send the withdrawal request.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard>
      <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-subtle">Request withdrawal</h2>
      <p className="mt-1 text-[13px] text-muted">Paid out as USDT on TRC20.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-5" noValidate>
        <AdminInput
          label="Amount (USD)"
          type="number"
          min={0}
          step="0.01"
          hint={`Available: ${formatCurrency(balance)}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <AdminInput
          label="Destination wallet address (TRC20)"
          autoComplete="off"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        {result && <Notice tone={result.tone}>{result.text}</Notice>}
        <AdminButton
          type="submit"
          variant="dark"
          loading={saving}
          disabled={!(value > 0) || value > balance || !address.trim()}
          className="w-full"
        >
          Send withdrawal request
        </AdminButton>
      </form>
    </AdminCard>
  );
}

function HistoryRow({ tx }: { tx: Transaction }) {
  const meta = [[tx.coin, tx.network].filter(Boolean).join(' '), tx.address].filter(Boolean).join(' · ');
  return (
    <li className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[15px] font-black uppercase tracking-tight text-ink">{tx.title}</p>
        <p className="mt-0.5 text-[12px] text-subtle">{formatDateTime(tx.createdAt)}</p>
        {meta && <p className="mt-1 break-all text-[12px] text-muted">{meta}</p>}
      </div>
      <div className="shrink-0 sm:text-right">
        <p className={cn('font-mono text-[16px] font-bold', tx.direction === 'credit' ? 'text-money' : 'text-ink')}>
          {formatSignedCurrency(tx.amount, tx.direction)}
        </p>
        <span
          className={cn(
            'mt-1 inline-block text-[10px] font-extrabold uppercase tracking-[0.14em]',
            tx.status === 'COMPLETED' && 'text-money',
            tx.status === 'REJECTED' && 'text-dangerSoft',
            tx.status === 'PENDING' && 'text-[#b08a2e]'
          )}
        >
          {tx.status === 'PENDING' ? 'Awaiting super-admin' : tx.status}
        </span>
      </div>
    </li>
  );
}
