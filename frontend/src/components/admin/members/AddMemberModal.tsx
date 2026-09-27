'use client';

import { useState, type FormEvent } from 'react';
import { AdminButton, AdminInput, AdminSelect, Notice, PicturesNeeded } from '@/components/admin/ui';
import { Modal } from '@/components/ui/Modal';
import { handleOf, useSubAdmins } from '@/hooks/useSubAdmins';
import { api, userMessage } from '@/lib/api';
import type { Member, Role } from '@/lib/types';

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  role: 'user' as Role,
  /** '' = owned by the super-admin. */
  ownerId: '',
  withdrawalLimit: '0',
};

/**
 * `kind="subAdmin"` is the Sub-admins page's form: the role is fixed and
 * there's no owner or withdrawal limit. For members, a super-admin also
 * picks the role and owning sub-admin; a sub-admin's new members are
 * always traders they own.
 */
export function AddMemberModal({
  open,
  onClose,
  onCreated,
  kind = 'member',
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (member: Member) => void;
  kind?: 'member' | 'subAdmin';
}) {
  const { isSuperAdmin, subAdmins } = useSubAdmins();
  const forSubAdmin = kind === 'subAdmin';
  const managesRoles = isSuperAdmin && !forSubAdmin;
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
      const { role, ownerId, withdrawalLimit, ...fields } = form;
      const member = forSubAdmin
        ? await api.admin.createSubAdmin(fields)
        : await api.admin.createMember({
            ...fields,
            withdrawalLimit: Number(withdrawalLimit) || 0,
            ...(managesRoles && { role, ownerId: role === 'user' ? ownerId || null : null }),
          });
      setForm(EMPTY);
      onCreated(member);
    } catch (err) {
      setError(userMessage(err, forSubAdmin ? 'Could not create the sub-admin.' : 'Could not create the member.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={forSubAdmin ? 'Add sub-admin' : 'Add member'}
      subtitle={
        forSubAdmin
          ? 'They get the admin portal, limited to the members, plans and products they add.'
          : 'Create an account on behalf of a member.'
      }
      size="lg"
    >
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
          {managesRoles && (
            <AdminSelect label="Administrative role" value={form.role} onChange={(e) => set('role')(e.target.value)}>
              <option value="user">User</option>
              <option value="sub_admin">Sub-admin</option>
              <option value="super_admin">Super-admin</option>
            </AdminSelect>
          )}
          {managesRoles && form.role === 'user' && (
            <AdminSelect
              label="Owned by"
              value={form.ownerId}
              hint="The member only sees their owner's plans."
              onChange={(e) => set('ownerId')(e.target.value)}
            >
              <option value="">Super-admin</option>
              {subAdmins
                .filter((s) => s.status === 'active')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} ({handleOf(s)})
                  </option>
                ))}
            </AdminSelect>
          )}
          {!forSubAdmin && (
            <AdminInput
              label="Withdrawal limit (USD)"
              type="number"
              min={0}
              step="0.01"
              hint="Max per withdrawal. 0 = use the global limit (Wallets & Support)."
              value={form.withdrawalLimit}
              onChange={(e) => set('withdrawalLimit')(e.target.value)}
            />
          )}
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
          {forSubAdmin ? 'Create sub-admin' : 'Create member'}
        </AdminButton>
      </form>
    </Modal>
  );
}
