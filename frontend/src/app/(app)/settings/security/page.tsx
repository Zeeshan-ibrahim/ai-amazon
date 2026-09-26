'use client';

import { useSession } from '@/components/layout/SessionProvider';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { PasswordForm } from '@/components/settings/PasswordForm';
import { SubPageHeader } from '@/components/settings/SubPageHeader';
import { ErrorState, LoadingBlock } from '@/components/ui/States';

export default function ManageSettingsPage() {
  const { user, loading, refresh } = useSession();

  if (loading) return <LoadingBlock rows={2} />;
  if (!user) return <ErrorState message="Account unavailable." onRetry={refresh} />;

  return (
    <div className="space-y-8 lg:space-y-10">
      <SubPageHeader
        title="Manage settings"
        description="Login password, withdrawal PIN and app language."
      />
      <div className="max-w-2xl">
        <PasswordForm />
      </div>
      <LanguageSelector current={user.language} />
    </div>
  );
}
