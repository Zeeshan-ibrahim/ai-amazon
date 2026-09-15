'use client';

import { useRouter } from 'next/navigation';
import { BoxIcon, DownloadIcon, UploadIcon } from '@/components/ui/Icons';

type Action = {
  id: string;
  title: string;
  hint: string;
  icon: typeof BoxIcon;
  onClick: () => void;
};

export function QuickActions({
  onDeposit,
  onWithdraw,
}: {
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  const router = useRouter();

  const actions: Action[] = [
    {
      id: 'deposit',
      title: 'Deposit USD',
      hint: 'Add funds to your balance',
      icon: DownloadIcon,
      onClick: onDeposit,
    },
    {
      id: 'withdraw',
      title: 'Withdraw USD',
      hint: 'Send funds to your bank',
      icon: UploadIcon,
      onClick: onWithdraw,
    },
    {
      id: 'products',
      title: 'Products Desk',
      hint: 'Browse and manage products',
      icon: BoxIcon,
      onClick: () => router.push('/products'),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:gap-5">
      {actions.map(({ id, title, hint, icon: Icon, onClick }) => (
        <button
          key={id}
          type="button"
          onClick={onClick}
          className="rounded-card border border-line bg-white p-5 text-left shadow-card transition-colors hover:border-ink/20"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <p className="mt-4 text-[17px] font-medium text-ink">{title}</p>
          <p className="mt-0.5 text-[13px] text-muted">{hint}</p>
        </button>
      ))}
    </div>
  );
}
