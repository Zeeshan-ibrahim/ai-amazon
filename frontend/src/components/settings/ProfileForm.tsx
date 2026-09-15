'use client';

import Image from 'next/image';
import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, Eyebrow } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

export function ProfileForm({
  user,
  onSaved,
}: {
  user: User;
  onSaved: (user: User) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    phone: user.phone,
    email: user.email,
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setMessage(null);
    try {
      const updated = (await api.updateProfile(form)) as User;
      onSaved(updated);
      setStatus('saved');
      setMessage('Account details updated.');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'Could not save your changes.'
      );
    }
  };

  return (
    <Card>
      <Eyebrow>Account</Eyebrow>
      <h2 className="mt-2 text-xl font-medium tracking-tight text-ink">
        Edit account parameters
      </h2>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div className="flex items-center gap-4 border-b border-line pb-5">
          <Image
            src={user.avatar}
            alt=""
            width={52}
            height={52}
            className="h-[52px] w-[52px] rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-ink">Profile picture</p>
            <p className="mt-0.5 text-[12px] text-subtle">
              JPG, JPEG, PNG or WebP · MAX 2MB
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            Upload
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
          <Input
            label="Username"
            placeholder="Not set"
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
          />
          <Input
            label="Phone number"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />

        {message && (
          <p
            className={
              status === 'error'
                ? 'text-[13px] text-dangerSoft'
                : 'text-[13px] text-money'
            }
          >
            {message}
          </p>
        )}

        <Button type="submit" size="lg" loading={status === 'saving'}>
          Save Changes
        </Button>
      </form>
    </Card>
  );
}
