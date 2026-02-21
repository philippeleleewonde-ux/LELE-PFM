/**
 * Formatting helpers for the reporting dashboard
 */
import { useEngineStore } from '@/stores/engine-store';

export function formatCurrency(amount: number, currency?: string): string {
  const cur = currency ?? useEngineStore.getState().currency ?? 'FCFA';
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${cur}`;
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export type GradeColor = {
  color: string;
  bg: string;
  label: string;
};

const GRADE_COLORS: Record<string, GradeColor> = {
  'A+': { color: '#FFD700', bg: 'rgba(255,215,0,0.15)', label: 'Excellent' },
  'A': { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)', label: 'Très bien' },
  'B': { color: '#4ADE80', bg: 'rgba(74,222,128,0.15)', label: 'Bien' },
  'C': { color: '#FDBA74', bg: 'rgba(253,186,116,0.15)', label: 'Moyen' },
  'D': { color: '#FB923C', bg: 'rgba(251,146,60,0.15)', label: 'Faible' },
  'E': { color: '#F87171', bg: 'rgba(248,113,113,0.15)', label: 'Critique' },
};

export function formatGrade(grade: string): GradeColor {
  return GRADE_COLORS[grade] ?? GRADE_COLORS['E'];
}

export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return `${Math.round(amount)}`;
}
