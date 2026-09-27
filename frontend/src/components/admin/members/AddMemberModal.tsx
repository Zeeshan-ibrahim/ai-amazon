'use client';

import { useState, type FormEvent } from 'react';
import { AdminButton, AdminInput, AdminSelect, Notice, PicturesNeeded } from '@/components/admin/ui';
import { Modal } from '@/components/ui/Modal';
import { api, userMessage } from '@/lib/api';
import type { Member, Role } from '@/lib/types';

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  role: 'user' as Role,
  withdrawalLimit: '0',
};

export function AddMemberModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (member: Member) => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const close = () => {
    setForm(EMPTY);
    setError(null);
    onClose();
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const member = await api.admin.createMember({
        ...form,
        withdrawalLimit: Number(form.withdrawalLimit) || 0,
      });
      setForm(EMPTY);
      onCreated(member);
    } catch (err) {
      setError(userMessage(err, 'Could not create the member.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Add member" subtitle="Create an account on behalf of a member." size="lg">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <PicturesNeeded what="Add member form" />
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminInput label="First name" value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} />
          <AdminInput label="Last name" value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} />
          <AdminInput
            label="Username slug"
            prefix="@"
            value={form.username.replace(/^@/, '')}
            onChange={(e) => set('username')(e.target.value)}
          />
          <AdminInput
            label="Email address"
            type="email"
            autoComplete="off"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
          />
          <AdminSelect label="Administrative role" value={form.role} onChange={(e) => set('role')(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </AdminSelect>
          <AdminInput
            label="Withdrawal limit (USD)"
            type="number"
            min={0}
            step="0.01"
            hint="Max per withdrawal. 0 = use the global limit (Wallets & Support)."
            value={form.withdrawalLimit}
            onChange={(e) => set('withdrawalLimit')(e.target.value)}
          />
        </div>
        <AdminInput
          label="Login password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(e) => set('password')(e.target.value)}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <AdminButton type="submit" size="lg" loading={saving} className="w-full">
          Create member
        </AdminButton>
      </form>
    </Modal>
  );
}
