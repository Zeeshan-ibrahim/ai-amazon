'use client';

import { useState } from 'react';
import { DepositModal } from '@/components/ledger/DepositModal';
import { WithdrawModal } from '@/components/ledger/WithdrawModal';
import { useSession } from '@/components/layout/SessionProvider';
import { ProfileHeader } from '@/components/settings/ProfileHeader';
import { RecentActivity } from '@/components/settings/RecentActivity';
import { SettingsMenu } from '@/components/settings/SettingsMenu';
import { ErrorState, LoadingBlock } from '@/components/ui/States';

/** The account hub ("Mine"): balance actions, the settings menu, recent activity. */
export default function SettingsPage() {
  const { user, loading, refresh, logout } = useSession();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  // Bumped after a new request so Recent activities reloads.
  const [activityKey, setActivityKey] = useState(0);

  if (loading) return <LoadingBlock rows={4} />;
  if (!user) {
    return <ErrorState message="Account unavailable." onRetry={refresh} />;
  }

  const onFiled = async () => {
    setActivityKey((k) => k + 1);
    await refresh();
  };

  return (
    <div className="space-y-8 lg:space-y-10">
      <ProfileHeader
        user={user}
        onDeposit={() => setDepositOpen(true)}
        onWithdraw={() => setWithdrawOpen(true)}
      />

      <SettingsMenu onSignOut={logout} />

      <RecentActivity key={activityKey} />

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={onFiled}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        balance={user.balance}
        onSuccess={onFiled}
      />
    </div>
  );
}
