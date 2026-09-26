'use client';

import { useSession } from '@/components/layout/SessionProvider';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { SubPageHeader } from '@/components/settings/SubPageHeader';
import { ErrorState, LoadingBlock } from '@/components/ui/States';

export default function ProfileSettingsPage() {
  const { user, loading, refresh, setUser } = useSession();

  if (loading) return <LoadingBlock rows={2} />;
  if (!user) return <ErrorState message="Account unavailable." onRetry={refresh} />;

  return (
    <div className="space-y-6 lg:space-y-8">
      <SubPageHeader
        title="Edit particulars"
        description="Your name, username and contact details."
      />
      <div className="max-w-2xl">
        <ProfileForm user={user} onSaved={setUser} />
      </div>
    </div>
  );
}
