import { Grade } from '../types';

export function formatCurrency(amountCents: number, devise: string = 'EUR', locale: string = 'fr-FR'): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: devise,
  });
  return formatter.format(amountCents / 100);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value).toFixed(decimals)}%`;
}

export function formatDate(date: string | Date, locale: string = 'fr-FR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function formatGrade(grade: Grade): string {
  const descriptions: Record<Grade, string> = {
    'A+': 'Excellent',
    A: 'Très Bon',
    B: 'Bon',
    C: 'Acceptable',
    D: 'Faible',
    E: 'Très Faible',
  };
  return descriptions[grade];
}
