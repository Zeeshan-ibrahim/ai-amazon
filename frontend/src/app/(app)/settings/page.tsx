'use client';

import { useState } from 'react';
import { DepositModal } from '@/components/ledger/DepositModal';
import { WithdrawModal } from '@/components/ledger/WithdrawModal';
import { useSession } from '@/components/layout/SessionProvider';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { PasswordForm } from '@/components/settings/PasswordForm';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { ProfileHeader } from '@/components/settings/ProfileHeader';
import { QuickActions } from '@/components/settings/QuickActions';
import { RecentActivity } from '@/components/settings/RecentActivity';
import { ErrorState, LoadingBlock } from '@/components/ui/States';

export default function SettingsPage() {
  const { user, loading, refresh, setUser } = useSession();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  if (loading) return <LoadingBlock rows={4} />;
  if (!user) {
    return <ErrorState message="Account unavailable." onRetry={refresh} />;
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      <ProfileHeader user={user} />

      <QuickActions
        onDeposit={() => setDepositOpen(true)}
        onWithdraw={() => setWithdrawOpen(true)}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <ProfileForm user={user} onSaved={setUser} />
        <PasswordForm />
      </div>

      <LanguageSelector current={user.language} />

      <RecentActivity />

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={refresh}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        balance={user.balance}
        onSuccess={refresh}
      />
    </div>
  );
}
