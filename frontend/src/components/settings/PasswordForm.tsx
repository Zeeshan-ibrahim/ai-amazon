'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, Eyebrow } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { api } from '@/lib/api';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function PasswordForm() {
  const [mode, setMode] = useState<'login' | 'pin'>('login');
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const isPin = mode === 'pin';

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setMessage(null);
    try {
      await api.updatePassword({ ...form, scope: mode });
      setForm(EMPTY);
      setStatus('saved');
      setMessage(isPin ? 'Withdrawal PIN updated.' : 'Password updated.');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'Could not update credentials.'
      );
    }
  };

  return (
    <Card>
      <Eyebrow>Security</Eyebrow>
      <h2 className="mt-2 text-xl font-medium tracking-tight text-ink">
        Password management
      </h2>

      <Tabs
        className="mt-5"
        active={mode}
        onChange={(id) => {
          setMode(id as 'login' | 'pin');
          setForm(EMPTY);
          setMessage(null);
        }}
        items={[
          { id: 'login', label: 'Login code' },
          { id: 'pin', label: 'Withdrawal PIN' },
        ]}
      />

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Input
          label={isPin ? 'Current PIN' : 'Current password'}
          type="password"
          autoComplete="current-password"
          placeholder={isPin ? '••••••' : 'password'}
          value={form.currentPassword}
          onChange={(e) => update('currentPassword', e.target.value)}
        />
        <Input
          label={isPin ? 'New PIN' : 'New password'}
          type="password"
          autoComplete="new-password"
          placeholder={isPin ? '••••••' : 'password'}
          value={form.newPassword}
          onChange={(e) => update('newPassword', e.target.value)}
        />
        <Input
          label={isPin ? 'Confirm new PIN' : 'Confirm new password'}
          type="password"
          autoComplete="new-password"
          placeholder={isPin ? '••••••' : 'password'}
          value={form.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
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

        <Button
          type="submit"
          variant="outline"
          size="lg"
          loading={status === 'saving'}
        >
          {isPin ? 'Update PIN' : 'Update Password'}
        </Button>
      </form>
    </Card>
  );
}
