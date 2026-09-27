'use client';

import { useState, type FormEvent } from 'react';
import { useSession } from '@/components/layout/SessionProvider';
import { AdminButton, AdminCard, AdminInput, AdminSelect, Notice } from '@/components/admin/ui';
import { handleOf, useSubAdmins } from '@/hooks/useSubAdmins';
import { api, userMessage } from '@/lib/api';
import type { Member, Role, User } from '@/lib/types';

const FIELD_LABELS: Record<string, string> = {
  firstName: 'first name',
  lastName: 'last name',
  username: 'username',
  phone: 'phone',
  email: 'email',
  role: 'role',
  status: 'status',
  ownerId: 'owner',
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
  status: member.status,
  /** '' = owned by the super-admin. */
  ownerId: member.addedBy?.id ?? '',
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
  const { isSuperAdmin, subAdmins } = useSubAdmins();
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
      const { password, withdrawalLimit, role, status, ownerId, ...rest } = form;
      const { member: updated, changed } = await api.admin.updateMember(member.id, {
        ...rest,
        withdrawalLimit: Number(withdrawalLimit) || 0,
        ...(password && { password }),
        // Only a super-admin may send these; the API refuses them from a sub-admin.
        ...(isSuperAdmin && {
          role: role as Role,
          status: status as User['status'],
          ownerId: role === 'user' ? ownerId || null : null,
        }),
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

        {isSuperAdmin && (
          <div className="grid gap-7 sm:grid-cols-2">
            <AdminSelect
              label="Administrative role"
              value={form.role}
              disabled={isSelf}
              hint={isSelf ? "You can't change your own role." : undefined}
              onChange={(e) => set('role')(e.target.value)}
            >
              <option value="user">User</option>
              <option value="sub_admin">Sub-admin</option>
              <option value="super_admin">Super-admin</option>
            </AdminSelect>
            <AdminSelect
              label="Account status"
              value={form.status}
              disabled={isSelf}
              hint={isSelf ? "You can't change your own status." : 'Suspended accounts cannot sign in.'}
              onChange={(e) => set('status')(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </AdminSelect>
            {form.role === 'user' && (
              <AdminSelect
                label="Owned by"
                value={form.ownerId}
                hint="The member only sees their owner's plans. Their history moves with them."
                onChange={(e) => set('ownerId')(e.target.value)}
              >
                <option value="">Super-admin</option>
                {subAdmins
                  .filter((s) => s.id !== member.id && (s.status === 'active' || s.id === form.ownerId))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} ({handleOf(s)})
                    </option>
                  ))}
              </AdminSelect>
            )}
          </div>
        )}

        {isSuperAdmin && member.role === 'sub_admin' && form.role !== 'sub_admin' && (
          <Notice tone="warn">
            Their members, plans and products will be handed back to the super-admin. Their balance stays
            with the account.
          </Notice>
        )}
        {isSuperAdmin && member.role === 'user' && form.role !== 'user' && (
          <Notice tone="warn">
            They lose the member app. Their balance stays with the account; open orders and plans stay in
            their history.
          </Notice>
        )}

        <div className="grid gap-7 sm:grid-cols-2">
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
