'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  WalletIcon,
} from '@/components/ui/Icons';
import { useApi } from '@/hooks/useApi';
import { useCopy } from '@/hooks/useCopy';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { Wallet } from '@/lib/types';

const MIN_DEPOSIT = 10;
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fetchWallets = () => api.wallets();

/**
 * Deposit Center: amount → company wallet → pay + upload receipt → filed.
 * The request stays PENDING until an admin approves it in Financials.
 */
export function DepositModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  // Unmounting on close resets the flow for the next deposit.
  if (!open) return null;
  return <DepositCenter onClose={onClose} onSuccess={onSuccess} />;
}

function DepositCenter({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetcher = useCallback(fetchWallets, []);
  const wallets = useApi<Wallet[]>(fetcher);
  const wallet = wallets.data?.find((w) => w.id === walletId) ?? null;
  const value = Math.round(Number(amount) * 100) / 100;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const submit = async () => {
    if (!wallet || !receipt) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('amount', String(value));
      form.set('walletId', wallet.id);
      form.set('receipt', receipt);
      await api.createDeposit(form);
      setStep(4);
      onSuccess?.();
    } catch (err) {
      setError(userMessage(err, 'Could not submit your deposit.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Deposit Center"
        className="relative z-10 max-h-[94vh] w-full overflow-y-auto rounded-t-[32px] bg-white px-5 pb-8 pt-7 shadow-modal sm:max-w-[540px] sm:rounded-[40px] sm:px-10 sm:py-10"
      >
        <header className="flex items-start justify-between gap-4 border-b border-black/[0.06] pb-6">
          <div>
            <h2 className="text-[26px] font-black uppercase leading-none tracking-tight text-ink sm:text-[30px]">
              Deposit Center
            </h2>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-subtle sm:text-[12px]">
              Strategic yield funding portal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-[12px] font-extrabold uppercase tracking-[0.16em] text-subtle transition-colors hover:text-ink"
          >
            Close
          </button>
        </header>

        <Stepper step={step} />

        {step === 1 && (
          <AmountStep
            amount={amount}
            onChange={setAmount}
            onNext={() => setStep(2)}
            valid={value >= MIN_DEPOSIT}
          />
        )}

        {step === 2 && (
          <WalletStep
            amount={value}
            wallets={wallets.data}
            loading={wallets.loading}
            error={wallets.error}
            selected={walletId}
            onSelect={setWalletId}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && wallet && (
          <PaymentStep
            wallet={wallet}
            amount={value}
            receipt={receipt}
            onReceipt={(file) => {
              setError(null);
              setReceipt(file);
            }}
            onError={setError}
            error={error}
            submitting={submitting}
            onBack={() => setStep(2)}
            onSubmit={submit}
          />
        )}

        {step === 4 && wallet && <FiledStep wallet={wallet} amount={value} onDone={onClose} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ pieces */

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mt-7 flex items-center justify-between gap-2 rounded-3xl bg-[#fafafa] px-6 py-4 sm:px-10">
      {[1, 2, 3].map((n) => (
        <li key={n} className="flex items-center gap-3">
          <span
            aria-current={step === n ? 'step' : undefined}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl text-[14px] font-black',
              step === n && 'bg-gold text-ink shadow-[0_8px_16px_-8px_rgba(217,180,90,0.9)]',
              step > n && 'bg-black text-gold',
              step < n && 'bg-black/[0.07] text-subtle'
            )}
          >
            {n}
          </span>
          {n < 3 && <span aria-hidden className="h-0.5 w-6 rounded bg-black/10 sm:w-8" />}
        </li>
      ))}
    </ol>
  );
}

function PrimaryButton({
  children,
  disabled,
  loading,
  onClick,
  className,
}: {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-5 text-[13px] font-extrabold uppercase tracking-[0.18em] text-gold shadow-[0_14px_28px_-16px_rgba(0,0,0,0.9)] transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/50 disabled:shadow-none',
        className
      )}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-2xl bg-black/[0.04] px-6 py-5 text-[13px] font-extrabold uppercase tracking-[0.18em] text-ink/70 transition-colors hover:bg-black/[0.07]"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      Back
    </button>
  );
}

/* ------------------------------------------------------------- steps */

function AmountStep({
  amount,
  onChange,
  onNext,
  valid,
}: {
  amount: string;
  onChange: (value: string) => void;
  onNext: () => void;
  valid: boolean;
}) {
  return (
    <form
      className="mt-7 space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onNext();
      }}
    >
      <div className="rounded-3xl border border-black/[0.04] bg-[#fafafa] p-5 sm:p-8">
        <label htmlFor="deposit-amount" className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-ink/70">
          Deposit portfolio amount (USD)
        </label>
        <div className="relative mt-5">
          <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[24px] font-black text-subtle">
            $
          </span>
          <input
            id="deposit-amount"
            type="number"
            inputMode="decimal"
            min={MIN_DEPOSIT}
            step="0.01"
            autoFocus
            placeholder="e.g. 1000"
            value={amount}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white py-5 pl-14 pr-5 text-[24px] font-black text-ink placeholder:text-subtle/70 focus:border-black/40 focus:outline-none focus:ring-4 focus:ring-gold/20"
          />
        </div>
        <p className="mt-3 pl-1 text-[12px] text-subtle">Minimum deposit {formatCurrency(MIN_DEPOSIT)}.</p>
      </div>
      <PrimaryButton onClick={onNext} disabled={!valid} className="w-full">
        Select crypto method <ArrowRightIcon className="h-4 w-4" />
      </PrimaryButton>
    </form>
  );
}

function WalletStep({
  amount,
  wallets,
  loading,
  error,
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  amount: number;
  wallets: Wallet[] | null;
  loading: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-7">
      <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-subtle">
        Select cryptocurrency wallet
      </p>
      <p className="mt-2 text-[14px] text-muted">
        Your entered amount: <strong className="text-ink">{formatCurrency(amount)}</strong>. Choose any
        corporate payment address:
      </p>

      <div role="radiogroup" aria-label="Payment wallet" className="mt-6 space-y-3">
        {loading && <p className="py-6 text-center text-sm text-subtle">Loading wallets…</p>}
        {error && <p className="rounded-2xl bg-dangerSoft/10 px-4 py-3 text-[13px] text-dangerSoft">{error}</p>}
        {wallets?.length === 0 && (
          <p className="py-6 text-center text-sm text-subtle">No payment wallets are available right now.</p>
        )}
        {wallets?.map((wallet) => {
          const checked = wallet.id === selected;
          return (
            <button
              key={wallet.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onSelect(wallet.id)}
              className={cn(
                'flex w-full items-center gap-4 rounded-3xl border bg-[#fafafa] p-4 text-left transition-colors sm:p-5',
                checked ? 'border-ink ring-1 ring-ink' : 'border-black/[0.05] hover:border-black/20'
              )}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-ink sm:h-14 sm:w-14">
                <WalletIcon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[16px] font-black text-ink">{wallet.coin}</span>
                  <span className="rounded-md bg-black/[0.07] px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.08em] text-ink/60">
                    {wallet.network}
                  </span>
                </span>
                <span className="mt-1 block truncate font-mono text-[13px] text-ink/70">{wallet.address}</span>
              </span>
              <span
                aria-hidden
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                  checked ? 'border-ink bg-ink' : 'border-black/20'
                )}
              >
                {checked && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={onNext} disabled={!selected}>
          Payment info
        </PrimaryButton>
      </div>
    </div>
  );
}

function PaymentStep({
  wallet,
  amount,
  receipt,
  onReceipt,
  onError,
  error,
  submitting,
  onBack,
  onSubmit,
}: {
  wallet: Wallet;
  amount: number;
  receipt: File | null;
  onReceipt: (file: File) => void;
  onError: (message: string) => void;
  error: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { copied, copy } = useCopy();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!receipt) return;
    const url = URL.createObjectURL(receipt);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!RECEIPT_TYPES.includes(file.type)) return onError('Receipt must be a JPG, PNG or WEBP image.');
    if (file.size > MAX_RECEIPT_BYTES) return onError('Receipt must be 5MB or smaller.');
    onReceipt(file);
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="mt-7">
      <section className="rounded-3xl border border-gold/20 bg-[#1c1c1c] p-5 text-white shadow-[0_20px_40px_-24px_rgba(0,0,0,0.9)] sm:p-7">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-gold">
            {wallet.coin} ({wallet.network}) network
          </p>
          <span className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-[11px] font-bold uppercase text-emerald-300">
            Ready
          </span>
        </div>

        <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80">
          Administrative wallet address
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 pl-4">
          <span className="min-w-0 flex-1 truncate font-mono text-[14px] font-semibold sm:text-[15px]">
            {wallet.address}
          </span>
          <button
            type="button"
            onClick={() => copy(wallet.address)}
            className="shrink-0 rounded-lg bg-gold px-4 py-2 font-mono text-[12px] font-bold uppercase text-ink transition-opacity hover:opacity-90"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80">
          Exact transfer amount
        </p>
        <p className="mt-2 font-mono text-[30px] font-bold">{formatCurrency(amount)}</p>
      </section>

      <p className="mt-7 pl-1 text-[13px] font-extrabold uppercase tracking-[0.16em] text-subtle">
        Upload receipt screenshot
      </p>
      <input
        ref={fileInput}
        type="file"
        accept={RECEIPT_TYPES.join(',')}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          accept(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'mt-3 flex w-full flex-col items-center rounded-3xl border-2 border-dashed px-5 py-8 text-center transition-colors',
          dragging ? 'border-gold bg-gold/5' : 'border-gold/60 bg-[#fafafa] hover:bg-gold/5'
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Selected receipt" className="max-h-44 rounded-2xl border border-black/10 object-contain" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink/60 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.35)]">
            <ArrowUpRightIcon className="h-6 w-6" />
          </span>
        )}
        <span className="mt-4 text-[15px] font-bold text-ink">
          {receipt ? receipt.name : 'Click to select payment screenshot'}
        </span>
        <span className="mt-1.5 text-[12px] text-subtle">
          {receipt ? 'Click to choose a different image' : 'Supports JPG, JPEG, PNG, WEBP • Maximum File Size: 5MB'}
        </span>
      </button>

      {error && (
        <p className="mt-4 rounded-2xl bg-dangerSoft/10 px-4 py-3 text-[13px] font-medium text-dangerSoft">{error}</p>
      )}

      <div className="mt-7 grid grid-cols-2 gap-3">
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={onSubmit} disabled={!receipt} loading={submitting}>
          Submit request
        </PrimaryButton>
      </div>
    </div>
  );
}

function FiledStep({ wallet, amount, onDone }: { wallet: Wallet; amount: number; onDone: () => void }) {
  return (
    <div className="mt-7">
      <p className="flex items-start gap-3 rounded-3xl border border-gold/20 bg-[#1c1c1c] px-6 py-5 text-[13px] font-extrabold uppercase leading-relaxed tracking-[0.12em] text-gold">
        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
        Your strategic deposit request has been submitted and is pending verification!
      </p>

      <div className="mt-10 flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-50 text-emerald-500 shadow-[0_14px_30px_-16px_rgba(16,185,129,0.8)]">
          <CheckIcon className="h-9 w-9" strokeWidth={2.4} />
        </span>
        <h3 className="mt-6 text-[22px] font-black uppercase tracking-tight text-ink">
          Deposit request filed!
        </h3>
        <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
          Your deposit screenshot and verification logs have been successfully dispatched to the
          administrative queue for swift validation.
        </p>
      </div>

      <dl className="mt-8 space-y-5 rounded-3xl border border-black/[0.04] bg-[#fafafa] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b-[1.5px] border-ink pb-2">
          <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-subtle">Deposit amount</dt>
          <dd className="font-mono text-[18px] font-bold text-ink">{formatCurrency(amount)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-b-[1.5px] border-ink pb-2">
          <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-subtle">Payment coin</dt>
          <dd className="text-[15px] font-black uppercase text-ink">
            {wallet.coin} ({wallet.network})
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-subtle">Request status</dt>
          <dd className="rounded-lg bg-[#1c1c1c] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gold">
            Pending review
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onDone}
        className="mt-7 w-full rounded-2xl bg-[#1c1c1c] px-6 py-5 text-[13px] font-extrabold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black"
      >
        Return to portfolio
      </button>
    </div>
  );
}
