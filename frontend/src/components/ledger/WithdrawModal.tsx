'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

export function WithdrawModal({
  open,
  onClose,
  balance,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.createWithdrawal({ amount: Number(amount), address, pin });
      setAmount('');
      setAddress('');
      setPin('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Withdraw USD"
      subtitle="Secure network • Admin audited"
      footer={
        <Button size="lg" fullWidth loading={submitting} onClick={submit}>
          Submit Withdrawal Request
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-line bg-[#FCFBF7] px-4 py-3.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
            Available funds
          </span>
          <span className="tabular text-lg font-medium text-ink">
            {formatCurrency(balance)}
          </span>
        </div>

        <Input
          label="Withdrawal amount"
          type="number"
          inputMode="decimal"
          prefix="$"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Input
          label="Destination wallet address"
          placeholder="Paste your USDT (TRC20) address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <Input
          label="Withdrawal PIN"
          type="password"
          inputMode="numeric"
          placeholder="••••••"
          hint="Your second ledger password, set under Settings."
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        {error && (
          <p className="rounded-lg bg-dangerSoft/8 px-3 py-2.5 text-[13px] text-dangerSoft">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
