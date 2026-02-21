/**
 * Formatting utilities for currency, date, numbers
 */

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatCurrency = (
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatNumber = (
  num: number,
  decimals: number = 2,
  locale: string = 'fr-FR'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatDate = (date: string | Date, formatStr: string = 'dd MMM yyyy'): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr, { locale: fr });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const formatShortDate = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy');
};

export const formatLongDate = (date: string | Date): string => {
  return formatDate(date, 'EEEE dd MMMM yyyy');
};

export const formatTime = (date: string | Date, timeFormat: string = 'HH:mm'): string => {
  return formatDate(date, timeFormat);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd MMM yyyy à HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

export const truncateString = (str: string, length: number = 30, suffix: string = '...'): string => {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};
