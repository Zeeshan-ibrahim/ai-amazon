'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminButton, AdminInput, AdminTextarea, Notice } from '@/components/admin/ui';
import { api, userMessage } from '@/lib/api';
import type { Banner } from '@/lib/types';

type Form = {
  imageUrl: string;
  title: string;
  description: string;
  supportNote: string;
};

const EMPTY: Form = { imageUrl: '', title: '', description: '', supportNote: '' };

const toForm = (banner: Banner): Form => ({
  imageUrl: banner.image ?? '',
  title: banner.title,
  description: banner.description,
  supportNote: banner.supportNote,
});

/** Add Banner and Edit Banner. Pass `banner` to edit it; leave it out to create one. */
export function BannerFormModal({
  open,
  banner,
  onClose,
  onSaved,
}: {
  open: boolean;
  banner?: Banner | null;
  onClose: () => void;
  onSaved: (banner: Banner) => void;
}) {
  const editing = Boolean(banner);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the banner (or blank) each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setForm(banner ? toForm(banner) : EMPTY);
    setError(null);
  }, [open, banner]);

  const set = (key: keyof Form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return setError('Enter a banner title.');

    setSaving(true);
    setError(null);
    const body = {
      imageUrl: form.imageUrl.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      supportNote: form.supportNote.trim(),
    };
    try {
      const saved = banner ? await api.admin.updateBanner(banner.id, body) : await api.admin.createBanner(body);
      onSaved(saved);
    } catch (err) {
      setError(userMessage(err, editing ? 'Could not update the banner.' : 'Could not create the banner.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal open={open} onClose={onClose} title={editing ? 'Edit banner' : 'Add banner'}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <AdminInput
          tone="soft"
          label="Banner image URL"
          labelAside={
            <span className="rounded-md bg-brand-500 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white">
              Recommended: 1200 x 675 (16:9)
            </span>
          }
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={form.imageUrl}
          onChange={(e) => set('imageUrl')(e.target.value)}
        />
        <AdminInput
          tone="soft"
          label="Title"
          placeholder="Summer Sale"
          value={form.title}
          onChange={(e) => set('title')(e.target.value)}
        />
        <AdminTextarea
          tone="soft"
          label="Description (optional)"
          placeholder="Up to 50% off..."
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
        />
        <AdminInput
          tone="soft"
          label="Support note (Telegram)"
          labelAside={
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">Auto-fills in chat</span>
          }
          placeholder="Internal reference..."
          value={form.supportNote}
          onChange={(e) => set('supportNote')(e.target.value)}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <AdminButton type="submit" size="lg" loading={saving} className="w-full">
          {editing ? 'Update banner' : 'Create banner'}
        </AdminButton>
      </form>
    </AdminModal>
  );
}
