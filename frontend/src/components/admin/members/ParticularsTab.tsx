'use client';

import { useState, type FormEvent } from 'react';
import { useSession } from '@/components/layout/SessionProvider';
import { AdminButton, AdminCard, AdminInput, AdminSelect, Notice } from '@/components/admin/ui';
import { api, userMessage } from '@/lib/api';
import type { Member, Role } from '@/lib/types';

const FIELD_LABELS: Record<string, string> = {
  firstName: 'first name',
  lastName: 'last name',
  username: 'username',
  phone: 'phone',
  email: 'email',
  role: 'role',
  withdrawalLimit: 'withdrawal limit',
  password: 'password',
};

const formFor = (member: Member) => ({
  firstName: member.firstName,
  lastName: member.lastName,
  username: member.username,
  phone: member.phone,
  email: member.loginEmail,
  role: member.role,
  withdrawalLimit: String(member.withdrawalLimit),
  password: '',
});

export function ParticularsTab({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: (member: Member) => void;
}) {
  const { user } = useSession();
  const isSelf = user?.id === member.id;
  const [form, setForm] = useState(() => formFor(member));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);

  const set = (key: keyof ReturnType<typeof formFor>) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const { password, withdrawalLimit, role, ...rest } = form;
      const { member: updated, changed } = await api.admin.updateMember(member.id, {
        ...rest,
        role: role as Role,
        withdrawalLimit: Number(withdrawalLimit) || 0,
        ...(password && { password }),
      });
      onSaved(updated);
      setForm(formFor(updated));
      setResult(
        changed.length
          ? { tone: 'success', text: `Saved: ${changed.map((f) => FIELD_LABELS[f] ?? f).join(', ')}.` }
          : { tone: 'info', text: 'Nothing changed.' }
      );
    } catch (err) {
      setResult({ tone: 'error', text: userMessage(err, 'Could not save.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard className="sm:p-9">
      <form onSubmit={onSubmit} className="space-y-7" noValidate>
        <div className="grid gap-7 sm:grid-cols-2">
          <AdminInput label="First name" value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} />
          <AdminInput label="Last name" value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} />
          <AdminInput
            label="Username slug"
            prefix="@"
            value={form.username.replace(/^@/, '')}
            onChange={(e) => set('username')(e.target.value)}
          />
          <AdminInput
            label="Phone number"
            type="tel"
            placeholder="+1 234 567 8900"
            value={form.phone}
            onChange={(e) => set('phone')(e.target.value)}
          />
        </div>

        <AdminInput
          label="Email address"
          type="email"
          autoComplete="off"
          hint="Used to sign in."
          value={form.email}
          onChange={(e) => set('email')(e.target.value)}
        />

        <div className="grid gap-7 sm:grid-cols-2">
          <AdminSelect
            label="Administrative role"
            value={form.role}
            disabled={isSelf}
            hint={isSelf ? "You can't change your own role." : undefined}
            onChange={(e) => set('role')(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </AdminSelect>
          <AdminInput
            label="Withdrawal limit (USD)"
            type="number"
            min={0}
            step="0.01"
            hint="Max per withdrawal. 0 = no limit."
            value={form.withdrawalLimit}
            onChange={(e) => set('withdrawalLimit')(e.target.value)}
          />
        </div>

        <AdminInput
          label="New login password (optional)"
          type="password"
          autoComplete="new-password"
          placeholder="Leave blank to keep current"
          value={form.password}
          onChange={(e) => set('password')(e.target.value)}
        />

        {result && <Notice tone={result.tone}>{result.text}</Notice>}

        <AdminButton type="submit" size="lg" loading={saving} className="w-full">
          Apply profile particulars
        </AdminButton>
      </form>
    </AdminCard>
  );
}
