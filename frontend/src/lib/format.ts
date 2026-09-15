const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactInt = new Intl.NumberFormat('en-US');

/** $1,234.50 */
export const formatCurrency = (value: number) => currency.format(value ?? 0);

/** 1,234 — used for whole-number stats. */
export const formatNumber = (value: number) => compactInt.format(value ?? 0);

/** Splits a currency value so the "$" can be styled separately. */
export const splitCurrency = (value: number) => {
  const [whole, decimals] = (value ?? 0).toFixed(2).split('.');
  return { whole: compactInt.format(Number(whole)), decimals };
};

export const formatStat = (value: number, format: 'currency' | 'count-plus') =>
  format === 'currency'
    ? `$${compactInt.format(Math.round(value))}`
    : `${compactInt.format(value)}+`;

export const formatPercent = (value: number) =>
  `${value > 0 ? '+' : ''}${value}%`;

export const formatSignedCurrency = (value: number, direction: 'credit' | 'debit') =>
  `${direction === 'credit' ? '+' : '-'}${formatCurrency(Math.abs(value))}`;

/** 8/8/2026 */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US');

/** 8/8/2026, 8:58:17 PM */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US');

export const greeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
