/** Tiny className joiner — no dependency needed for this project's scale. */
export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');
