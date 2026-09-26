'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { homeFor } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user } = await api.signup(form);
      router.push(homeFor(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start trading Amazon arbitrage lots today"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-ink hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Input
          label="First name"
          placeholder="Alexandra"
          value={form.firstName}
          onChange={(e) => update('firstName')(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={(e) => update('email')(e.target.value)}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={form.password}
          onChange={(e) => update('password')(e.target.value)}
        />

        {error && (
          <p className="rounded-lg bg-dangerSoft/8 px-3 py-2.5 text-[13px] text-dangerSoft">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
