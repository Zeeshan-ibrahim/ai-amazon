'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from '@/components/layout/SessionProvider';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, userMessage } from '@/lib/api';
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
  const { user } = useSession();
  // The API refuses withdrawals until a PIN exists; say so before the form is filled in.
  const needsPin = user !== null && !user.doubleLedgerPassword;

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
      setError(userMessage(err, 'Withdrawal request failed.'));
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
        <Button size="lg" fullWidth loading={submitting} disabled={needsPin} onClick={submit}>
          Submit Withdrawal Request
        </Button>
      }
    >
      <div className="space-y-5">
        {needsPin && (
          <p className="rounded-lg bg-gold/15 px-3 py-2.5 text-[13px] text-[#8A6A1F]">
            Set a withdrawal PIN before withdrawing.{' '}
            <Link
              href="/settings/security"
              onClick={onClose}
              className="font-medium underline underline-offset-2"
            >
              Set it in Manage Settings
            </Link>
          </p>
        )}

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
          hint="Your second ledger password, set under Settings → Manage Settings."
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
