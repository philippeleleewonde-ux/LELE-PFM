/**
 * Portuguese spoken number parser for voice expense input.
 */
import { NumberParser } from './types';

const UNITS: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15,
  dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50,
  sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(reais?|real|euros?)\b/g, '')
    .replace(/-/g, ' ')
    .trim();
}

function parsePortugueseNumber(input: string): number {
  const norm = normalize(input);

  const digitsOnly = norm.replace(/[\s.,]/g, '');
  if (/^\d+$/.test(digitsOnly)) {
    return parseInt(digitsOnly, 10);
  }

  const tokens = norm.split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      current += parseInt(token, 10);
      continue;
    }
    if (UNITS[token] !== undefined) {
      current += UNITS[token];
      continue;
    }
    if (token === 'e') continue;
    if (token === 'cem' || token === 'cento' || token === 'centos') {
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
    if (token === 'milhao' || token === 'milhoes') {
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
  ...Object.keys(UNITS), 'cem', 'cento', 'centos', 'mil', 'milhao', 'milhoes', 'e',
]);

const STRIP_WORDS = /^(no|na|nos|nas|ao|em|de|do|da|dos|das|para|por|o|a|os|as|um|uma|com)\s+/i;

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
    const amount = parsePortugueseNumber(trailingDigits[2]);
    if (amount > 0) {
      const description = cleanDescription(trailingDigits[1]);
      if (description.length > 0) return { amount, description };
    }
  }

  const leadingDigits = norm.match(/^(\d[\d\s.,]*)\s+(.+)$/);
  if (leadingDigits) {
    const amount = parsePortugueseNumber(leadingDigits[1]);
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
    const amount = parsePortugueseNumber(tokens.slice(0, splitIdx).join(' '));
    if (amount > 0) {
      const description = cleanDescription(tokens.slice(splitIdx).join(' '));
      if (description.length > 0) return { amount, description };
    }
  }

  for (let i = tokens.length - 1; i >= 1; i--) {
    if (NUMBER_WORDS.has(tokens[i]) || /^\d+$/.test(tokens[i])) {
      const amount = parsePortugueseNumber(tokens.slice(i).join(' '));
      if (amount > 0) {
        const description = cleanDescription(tokens.slice(0, i).join(' '));
        if (description.length > 0) return { amount, description };
      }
    } else {
      break;
    }
  }

  const fullAmount = parsePortugueseNumber(norm);
  return { amount: fullAmount, description: '' };
}

export const ptParser: NumberParser = {
  parseNumber: parsePortugueseNumber,
  parseVoiceExpense,
};
