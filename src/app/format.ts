import { RGS_AMOUNT_MULTIPLIER, type Money } from '../domain/round';

export function formatMoney(amount: number, currency = 'USD'): string {
  const value = amount / RGS_AMOUNT_MULTIPLIER;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export const formatBalance = (m: Money | null): string => (m ? formatMoney(m.amount, m.currency) : '—');

export function formatX(multiplier100: number): string {
  const m = multiplier100 / 100;
  return `x${Number.isInteger(m) ? m.toLocaleString('en-US') : m.toFixed(2)}`;
}
