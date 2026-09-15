'use client';

import { useCallback, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Eyebrow, SectionTitle } from '@/components/ui/Card';
import type { Language } from '@/lib/types';

const fetchLanguages = () => api.languages() as Promise<Language[]>;

export function LanguageSelector({ current }: { current: string }) {
  const fetcher = useCallback(fetchLanguages, []);
  const { data } = useApi<Language[]>(fetcher);
  const [selected, setSelected] = useState(current);

  const choose = async (code: string) => {
    setSelected(code);
    try {
      await api.updateLanguage(code);
    } catch {
      setSelected(current);
    }
  };

  return (
    <section>
      <Eyebrow>Your system language preferences</Eyebrow>
      <SectionTitle className="mt-2">Select app language</SectionTitle>

      <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        {(data ?? []).map((language) => (
          <button
            key={language.code}
            type="button"
            onClick={() => choose(language.code)}
            className={cn(
              'h-[52px] shrink-0 rounded-xl border px-7 text-[15px] transition-colors',
              selected === language.code
                ? 'border-ink bg-white font-medium text-ink'
                : 'border-line bg-white text-muted hover:border-ink/25 hover:text-ink'
            )}
          >
            {language.label}
          </button>
        ))}
      </div>
    </section>
  );
}
