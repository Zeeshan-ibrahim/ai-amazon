'use client';

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApi } from '@/hooks/useApi';
import { useCopy } from '@/hooks/useCopy';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { DepositAsset } from '@/lib/types';
import {
  CheckIcon,
  CopyIcon,
  ExternalIcon,
  UploadCloudIcon,
} from '@/components/ui/Icons';

const fetchAssets = () => api.depositAssets() as Promise<DepositAsset[]>;

export function DepositModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const fetcher = useCallback(fetchAssets, []);
  const { data: assets } = useApi<DepositAsset[]>(fetcher);
  const { copied, copy } = useCopy();
  const fileInput = useRef<HTMLInputElement>(null);

  const [assetId, setAssetId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selected =
    assets?.find((asset) => asset.id === assetId) ?? assets?.[0] ?? null;

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) setReceipt(file);
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setReceipt(file);
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.createDeposit({
        amount: Number(amount),
        assetId: selected?.id,
        receiptName: receipt?.name ?? null,
      });
      setAmount('');
      setReceipt(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crypto Asset Ledger Ingress"
      subtitle="Step 1 of 2 • Secure network"
      footer={
        <Button size="lg" fullWidth loading={submitting} onClick={submit}>
          Broadcast Deposit Request
        </Button>
      }
    >
      <div className="space-y-6">
        <section>
          <h4 className="mb-3 text-[15px] font-medium text-ink">
            1. Select Cryptographic Asset
          </h4>
          <div className="grid grid-cols-3 gap-2.5">
            {(assets ?? []).map((asset) => {
              const isActive = selected?.id === asset.id;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setAssetId(asset.id)}
                  className={cn(
                    'rounded-xl border px-2 py-3 text-center transition-colors',
                    isActive
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-line bg-white hover:border-ink/20'
                  )}
                >
                  <p
                    className={cn(
                      'text-[13px] font-medium sm:text-sm',
                      isActive ? 'text-brand-600' : 'text-ink'
                    )}
                  >
                    {asset.symbol}
                  </p>
                  <p className="mt-0.5 text-[11px] text-subtle">{asset.network}</p>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-3 rounded-xl border border-line bg-[#FCFBF7] p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
                  Official custody address ({selected.symbol})
                </p>
                <span className="shrink-0 rounded-md border border-line bg-white px-2 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted">
                  {selected.networkLabel}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-3">
                <code className="flex-1 overflow-x-auto whitespace-nowrap text-[12px] font-medium text-ink scrollbar-none sm:text-[13px]">
                  {selected.address}
                </code>
                <button
                  type="button"
                  onClick={() => copy(selected.address)}
                  aria-label="Copy deposit address"
                  className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-ink"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-brand-600" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                <p className="text-[12px] text-muted">
                  Verification threshold: {selected.confirmations}
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
                >
                  <ExternalIcon className="h-3.5 w-3.5" />
                  Live Support Escrow
                </button>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h4 className="text-[15px] font-medium text-ink">
              2. Deposit Amount (USD Equivalents)
            </h4>
            <span className="text-[12px] text-subtle">
              Min allowed: ${selected?.minAmount ?? 10}
            </span>
          </div>
          <Input
            type="number"
            inputMode="decimal"
            prefix="$"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </section>

        <section>
          <h4 className="mb-3 text-[15px] font-medium text-ink">
            3. Upload Payment Verification Screenshot
          </h4>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors',
              dragging
                ? 'border-brand-400 bg-brand-50'
                : 'border-line bg-white hover:border-ink/20'
            )}
          >
            <UploadCloudIcon className="mb-2.5 h-6 w-6 text-muted" />
            <p className="text-[13px] font-medium text-ink">
              {receipt ? receipt.name : 'Drag & Drop Payment receipt here'}
            </p>
            <p className="mt-1 text-[11px] text-subtle">
              or click to browse local folders (Support PNG, JPG, GIF up to 5MB)
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/gif"
              className="hidden"
              onChange={onPick}
            />
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-dangerSoft/8 px-3 py-2.5 text-[13px] text-dangerSoft">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
