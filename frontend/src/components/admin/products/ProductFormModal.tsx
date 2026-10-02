'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminButton, AdminInput, AdminTextarea, Notice } from '@/components/admin/ui';
import { api, userMessage } from '@/lib/api';
import type { AdminProduct } from '@/lib/types';

type Form = {
  title: string;
  price: string;
  profitPercentage: string;
  imageUrl: string;
  description: string;
};

const EMPTY: Form = { title: '', price: '', profitPercentage: '', imageUrl: '', description: '' };

const toForm = (product: AdminProduct): Form => ({
  title: product.title,
  price: String(product.price),
  profitPercentage: String(product.profitPercentage),
  imageUrl: product.image ?? '',
  description: product.description,
});

/**
 * Add Product and Edit Product. Pass `product` to edit it; leave it out
 * to create a new one.
 */
export function ProductFormModal({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product?: AdminProduct | null;
  onClose: () => void;
  onSaved: (product: AdminProduct) => void;
}) {
  const editing = Boolean(product);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the product (or blank) each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setForm(product ? toForm(product) : EMPTY);
    setError(null);
  }, [open, product]);

  const set = (key: keyof Form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return setError('Enter a product title.');
    if (!(Number(form.price) > 0)) return setError('Enter an entry price greater than $0.');

    setSaving(true);
    setError(null);
    const body = {
      title: form.title.trim(),
      price: Number(form.price),
      profitPercentage: Number(form.profitPercentage) || 0,
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim(),
    };
    try {
      const saved = product
        ? await api.admin.updateProduct(product.id, body)
        : await api.admin.createProduct(body);
      onSaved(saved);
    } catch (err) {
      setError(userMessage(err, editing ? 'Could not update the product.' : 'Could not create the product.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal open={open} onClose={onClose} title={editing ? 'Edit product' : 'Add product'}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <AdminInput
          tone="soft"
          label="Product title"
          placeholder="e.g. Portfolio A"
          value={form.title}
          onChange={(e) => set('title')(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          <AdminInput
            tone="soft"
            label="Entry price (USD)"
            type="number"
            inputMode="decimal"
            min={0.01}
            step="0.01"
            placeholder="999.00"
            value={form.price}
            onChange={(e) => set('price')(e.target.value)}
          />
          <AdminInput
            tone="soft"
            label="Return %"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.001"
            placeholder="2.5"
            value={form.profitPercentage}
            onChange={(e) => set('profitPercentage')(e.target.value)}
          />
        </div>
        <AdminInput
          tone="soft"
          label="Image URL"
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={form.imageUrl}
          onChange={(e) => set('imageUrl')(e.target.value)}
        />
        <AdminTextarea
          tone="soft"
          label="Product description"
          placeholder="Product details..."
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <AdminButton type="submit" size="lg" loading={saving} className="w-full">
          {editing ? 'Update product' : 'Create product'}
        </AdminButton>
      </form>
    </AdminModal>
  );
}
