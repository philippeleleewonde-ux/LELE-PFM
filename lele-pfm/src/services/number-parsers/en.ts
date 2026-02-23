/**
 * English spoken number parser for voice expense input.
 */
import { NumberParser } from './types';

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/\b(dollars?|euros?|pounds?|bucks?)\b/g, '')
    .replace(/-/g, ' ')
    .trim();
}

function parseEnglishNumber(input: string): number {
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
    if (token === 'and') continue;
    if (token === 'hundred') {
      if (current === 0) current = 1;
      current *= 100;
      continue;
    }
    if (token === 'thousand') {
      if (current === 0) current = 1;
      total += current * 1000;
      current = 0;
      continue;
    }
    if (token === 'million') {
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
  ...Object.keys(UNITS), 'hundred', 'thousand', 'million', 'and',
]);

const STRIP_WORDS = /^(at|for|to|in|on|the|a|an|my|from|with|of)\s+/i;

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

  // Amount at the end as digits
  const trailingDigits = norm.match(/^(.+?)\s+(\d[\d\s.,]*)$/);
  if (trailingDigits) {
    const amount = parseEnglishNumber(trailingDigits[2]);
    if (amount > 0) {
      const description = cleanDescription(trailingDigits[1]);
      if (description.length > 0) return { amount, description };
    }
  }

  // Amount at the start as digits
  const leadingDigits = norm.match(/^(\d[\d\s.,]*)\s+(.+)$/);
  if (leadingDigits) {
    const amount = parseEnglishNumber(leadingDigits[1]);
    if (amount > 0) {
      const description = cleanDescription(leadingDigits[2]);
      if (description.length > 0) return { amount, description };
    }
  }

  // Number words at the start
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
    const amount = parseEnglishNumber(tokens.slice(0, splitIdx).join(' '));
    if (amount > 0) {
      const description = cleanDescription(tokens.slice(splitIdx).join(' '));
      if (description.length > 0) return { amount, description };
    }
  }

  // Description at the start, number words at the end
  for (let i = tokens.length - 1; i >= 1; i--) {
    if (NUMBER_WORDS.has(tokens[i]) || /^\d+$/.test(tokens[i])) {
      const amount = parseEnglishNumber(tokens.slice(i).join(' '));
      if (amount > 0) {
        const description = cleanDescription(tokens.slice(0, i).join(' '));
        if (description.length > 0) return { amount, description };
      }
    } else {
      break;
    }
  }

  const fullAmount = parseEnglishNumber(norm);
  return { amount: fullAmount, description: '' };
}

export const enParser: NumberParser = {
  parseNumber: parseEnglishNumber,
  parseVoiceExpense,
};
