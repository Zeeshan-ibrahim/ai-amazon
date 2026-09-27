'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminButton, AdminInput, AdminTextarea, Notice } from '@/components/admin/ui';
import { api, userMessage } from '@/lib/api';
import type { Plan } from '@/lib/types';

type Form = {
  name: string;
  tag: string;
  description: string;
  price: string;
  imageUrl: string;
};

const EMPTY: Form = { name: '', tag: '', description: '', price: '', imageUrl: '' };

const toForm = (plan: Plan): Form => ({
  name: plan.name,
  tag: plan.tag,
  description: plan.description,
  price: String(plan.price),
  imageUrl: plan.image ?? '',
});

/** Add Plan and Edit Plan. Pass `plan` to edit it; leave it out to create one. */
export function PlanFormModal({
  open,
  plan,
  onClose,
  onSaved,
}: {
  open: boolean;
  plan?: Plan | null;
  onClose: () => void;
  onSaved: (plan: Plan) => void;
}) {
  const editing = Boolean(plan);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the plan (or blank) each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setForm(plan ? toForm(plan) : EMPTY);
    setError(null);
  }, [open, plan]);

  const set = (key: keyof Form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setError('Enter a plan name.');
    if (!(Number(form.price) > 0)) return setError('Enter a price greater than 0 USDT.');

    setSaving(true);
    setError(null);
    const body = {
      name: form.name.trim(),
      tag: form.tag.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      imageUrl: form.imageUrl.trim(),
    };
    try {
      const saved = plan ? await api.admin.updatePlan(plan.id, body) : await api.admin.createPlan(body);
      onSaved(saved);
    } catch (err) {
      setError(userMessage(err, editing ? 'Could not update the plan.' : 'Could not create the plan.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal open={open} onClose={onClose} title={editing ? 'Edit plan' : 'Add plan'}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <AdminInput
          tone="soft"
          label="Plan name"
          placeholder="Premium Tier"
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
        />
        <AdminInput
          tone="soft"
          label="Plan tag"
          placeholder="VIP 1"
          value={form.tag}
          onChange={(e) => set('tag')(e.target.value)}
        />
        <AdminTextarea
          tone="soft"
          label="Description"
          placeholder="Describe the plan benefits..."
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
        />
        <AdminInput
          tone="soft"
          label="Price (USDT)"
          type="number"
          inputMode="decimal"
          min={0.01}
          step="0.01"
          placeholder="100"
          value={form.price}
          onChange={(e) => set('price')(e.target.value)}
        />
        <AdminInput
          tone="soft"
          label="Image URL"
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={form.imageUrl}
          onChange={(e) => set('imageUrl')(e.target.value)}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <AdminButton type="submit" size="lg" loading={saving} className="w-full rounded-[22px] tracking-[0.2em]">
          {editing ? 'Update plan' : 'Create plan'}
        </AdminButton>
      </form>
    </AdminModal>
  );
}
