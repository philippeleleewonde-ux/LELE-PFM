/**
 * ISO 8601 week utilities for weekly expense tracking.
 * Week starts on Monday (day 1), ends on Sunday (day 7).
 */

import i18n from '@/i18n';

/**
 * Get ISO 8601 week number for a date.
 * Uses the algorithm where week 1 is the week containing the first Thursday of the year.
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}

/**
 * Get the ISO year for a given date's ISO week.
 * The ISO year can differ from the calendar year near year boundaries.
 */
export function getISOYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * Get the start (Monday) and end (Sunday) dates for a given ISO week number and year.
 */
export function getWeekDates(week: number, year: number): { start: Date; end: Date } {
  // Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  // Monday of week 1
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return { start, end };
}

/**
 * Get the current ISO week number and year.
 */
export function getCurrentWeek(): { week: number; year: number } {
  const now = new Date();
  return {
    week: getWeekNumber(now),
    year: getISOYear(now),
  };
}

/**
 * Format a week label like "10 - 16 Fev 2026"
 */
export function getWeekLabel(week: number, year: number): string {
  const { start, end } = getWeekDates(week, year);
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startMonth = i18n.t(`tracking:monthsShort.${start.getUTCMonth()}`);
  const endMonth = i18n.t(`tracking:monthsShort.${end.getUTCMonth()}`);


  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${startDay} - ${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

/**
 * Format a week range label like "du 10 au 16 Fevrier 2026"
 * Uses full month names for readability.
 */
export function getWeekRangeLabel(week: number, year: number): string {
  const { start, end } = getWeekDates(week, year);
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startMonth = i18n.t(`tracking:months.${start.getUTCMonth()}`);
  const endMonth = i18n.t(`tracking:months.${end.getUTCMonth()}`);

  const endYear = end.getUTCFullYear();

  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${startDay} - ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
}

/**
 * Check if a date falls within a given ISO week.
 */
export function isDateInWeek(date: Date, week: number, year: number): boolean {
  return getWeekNumber(date) === week && getISOYear(date) === year;
}

/**
 * Get the day of week (1=Monday, 7=Sunday) for a date.
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay() || 7;
}

/**
 * Format a date as ISO string (YYYY-MM-DD).
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get yesterday's date.
 */
export function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}
