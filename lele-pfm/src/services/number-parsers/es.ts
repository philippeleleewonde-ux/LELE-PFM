/**
 * Spanish spoken number parser for voice expense input.
 */
import { NumberParser } from './types';

const UNITS: Record<string, number> = {
  cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27,
  veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50,
  sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(pesos?|dolares?|euros?)\b/g, '')
    .replace(/-/g, ' ')
    .trim();
}

function parseSpanishNumber(input: string): number {
  const norm = normalize(input);

  const digitsOnly = norm.replace(/[\s.,]/g, '');
  if (/^\d+$/.test(digitsOnly)) {
    return parseInt(digitsOnly, 10);
  }

  const tokens = norm.split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (/^\d+$/.test(token)) {
      current += parseInt(token, 10);
      continue;
    }
    if (UNITS[token] !== undefined) {
      current += UNITS[token];
      continue;
    }
    if (token === 'y') continue;
    if (token === 'cien' || token === 'ciento' || token === 'cientos') {
      if (current === 0) current = 1;
      current *= 100;
      continue;
    }
    if (token === 'mil') {
      if (current === 0) current = 1;
      total += current * 1000;
      current = 0;
      continue;
    }
    if (token === 'millon' || token === 'millones') {
      if (current === 0) current = 1;
      total += current * 1000000;
      current = 0;
      continue;
    }
  }

  total += current;
  return total;
}

const NUMBER_WORDS = new Set([
  ...Object.keys(UNITS), 'cien', 'ciento', 'cientos', 'mil', 'millon', 'millones', 'y',
]);

const STRIP_WORDS = /^(en|al|el|la|los|las|de|del|para|por|un|una|con)\s+/i;

function cleanDescription(raw: string): string {
  let desc = raw.trim();
  let prev = '';
  while (prev !== desc) {
    prev = desc;
    desc = desc.replace(STRIP_WORDS, '').trim();
  }
  if (desc.length > 0) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }
  return desc;
}

function parseVoiceExpense(input: string): { amount: number; description: string } {
  const norm = normalize(input);

  const trailingDigits = norm.match(/^(.+?)\s+(\d[\d\s.,]*)$/);
  if (trailingDigits) {
    const amount = parseSpanishNumber(trailingDigits[2]);
    if (amount > 0) {
      const description = cleanDescription(trailingDigits[1]);
      if (description.length > 0) return { amount, description };
    }
  }

  const leadingDigits = norm.match(/^(\d[\d\s.,]*)\s+(.+)$/);
  if (leadingDigits) {
    const amount = parseSpanishNumber(leadingDigits[1]);
    if (amount > 0) {
      const description = cleanDescription(leadingDigits[2]);
      if (description.length > 0) return { amount, description };
    }
  }

  const tokens = norm.split(/\s+/);
  let splitIdx = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (NUMBER_WORDS.has(tokens[i]) || /^\d+$/.test(tokens[i])) {
      splitIdx = i + 1;
    } else {
      break;
    }
  }

  if (splitIdx > 0 && splitIdx < tokens.length) {
    const amount = parseSpanishNumber(tokens.slice(0, splitIdx).join(' '));
    if (amount > 0) {
      const description = cleanDescription(tokens.slice(splitIdx).join(' '));
      if (description.length > 0) return { amount, description };
    }
  }

  for (let i = tokens.length - 1; i >= 1; i--) {
    if (NUMBER_WORDS.has(tokens[i]) || /^\d+$/.test(tokens[i])) {
      const amount = parseSpanishNumber(tokens.slice(i).join(' '));
      if (amount > 0) {
        const description = cleanDescription(tokens.slice(0, i).join(' '));
        if (description.length > 0) return { amount, description };
      }
    } else {
      break;
    }
  }

  const fullAmount = parseSpanishNumber(norm);
  return { amount: fullAmount, description: '' };
}

export const esParser: NumberParser = {
  parseNumber: parseSpanishNumber,
  parseVoiceExpense,
};
