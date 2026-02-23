/**
 * French spoken number parser for voice expense input.
 * Zero dependencies — pure TypeScript.
 */

const UNITS: Record<string, number> = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5,
  six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12,
  treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
};

const TEENS = new Set(['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize']);

// Normalize: lowercase, strip accents, strip currency words
function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(francs?|fcfa|cfa|xof)\b/g, '')
    .trim();
}

/**
 * Pre-process token array to merge compound numbers before the main loop.
 * Converts patterns like: [soixante, dix] → [70], [quatre, vingt, dix, sept] → [97]
 */
function resolveCompounds(tokens: string[]): string[] {
  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    // quatre-vingt-dix-X or quatre-vingt-X or quatre-vingts
    if (tokens[i] === 'quatre' && i + 1 < tokens.length && (tokens[i + 1] === 'vingt' || tokens[i + 1] === 'vingts')) {
      // quatre-vingt-dix + unit? (90-99)
      if (i + 2 < tokens.length && tokens[i + 2] === 'dix') {
        if (i + 3 < tokens.length && UNITS[tokens[i + 3]] !== undefined && UNITS[tokens[i + 3]] <= 9) {
          result.push(String(90 + UNITS[tokens[i + 3]]));
          i += 4;
          continue;
        }
        result.push('90');
        i += 3;
        continue;
      }
      // quatre-vingt + teen (80 + 11..16 for 91-96 — but this is non-standard, skip)
      // quatre-vingt + unit (81-89)
      if (i + 2 < tokens.length && UNITS[tokens[i + 2]] !== undefined && UNITS[tokens[i + 2]] >= 1 && UNITS[tokens[i + 2]] <= 16) {
        result.push(String(80 + UNITS[tokens[i + 2]]));
        i += 3;
        continue;
      }
      // plain quatre-vingts = 80
      result.push('80');
      i += 2;
      continue;
    }

    // soixante-dix + unit? (70-79)
    if (tokens[i] === 'soixante') {
      if (i + 1 < tokens.length && tokens[i + 1] === 'et' && i + 2 < tokens.length && tokens[i + 2] === 'onze') {
        result.push('71');
        i += 3;
        continue;
      }
      if (i + 1 < tokens.length && TEENS.has(tokens[i + 1])) {
        const base = 60 + (UNITS[tokens[i + 1]] ?? 0);
        // soixante-dix-sept etc (60+10+7 = 77)
        if (tokens[i + 1] === 'dix' && i + 2 < tokens.length && UNITS[tokens[i + 2]] !== undefined && UNITS[tokens[i + 2]] <= 9) {
          result.push(String(70 + UNITS[tokens[i + 2]]));
          i += 3;
          continue;
        }
        result.push(String(base));
        i += 2;
        continue;
      }
    }

    result.push(tokens[i]);
    i++;
  }

  return result;
}

/**
 * Parse a French spoken number string into a numeric value.
 * Handles: digits ("15 000"), words ("quinze mille"), mixed ("15 mille").
 */
export function parseFrenchNumber(input: string): number {
  const norm = normalize(input);

  // Try direct digit extraction: "15 000" → 15000, "2500" → 2500
  const digitsOnly = norm.replace(/[\s.,]/g, '');
  if (/^\d+$/.test(digitsOnly)) {
    return parseInt(digitsOnly, 10);
  }

  // Tokenize, resolve compounds, then accumulate
  const rawTokens = norm.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  const tokens = resolveCompounds(rawTokens);

  let total = 0;
  let current = 0;

  for (const token of tokens) {
    // Pure digit token (mixed: "15 mille", or resolved compound "90")
    if (/^\d+$/.test(token)) {
      current += parseInt(token, 10);
      continue;
    }

    // Simple units
    if (UNITS[token] !== undefined) {
      current += UNITS[token];
      continue;
    }

    // "et" connector — skip
    if (token === 'et') continue;

    // Multiplier: cent (x100)
    if (token === 'cent' || token === 'cents') {
      if (current === 0) current = 1;
      current *= 100;
      continue;
    }

    // Multiplier: mille (x1000)
    if (token === 'mille') {
      if (current === 0) current = 1;
      total += current * 1000;
      current = 0;
      continue;
    }

    // Multiplier: million
    if (token === 'million' || token === 'millions') {
      if (current === 0) current = 1;
      total += current * 1000000;
      current = 0;
      continue;
    }
  }

  total += current;
  return total;
}

// Prepositions and articles to strip from descriptions
const STRIP_WORDS = /^(au|aux|pour|a|chez|de|du|des|le|la|les|l|en|dans|sur|un|une)\s+/i;

// All number-like words for boundary detection
const NUMBER_WORDS = new Set([
  ...Object.keys(UNITS), 'cent', 'cents', 'mille', 'million', 'millions', 'et', 'vingts',
]);

/**
 * Parse a voice expense utterance into amount + description.
 * Examples:
 *   "Quinze mille au supermarche" → { amount: 15000, description: "Supermarche" }
 *   "Taxi 2500" → { amount: 2500, description: "Taxi" }
 *   "2500 francs pour le marche" → { amount: 2500, description: "Marche" }
 */
export function parseVoiceExpense(input: string): { amount: number; description: string } {
  const norm = normalize(input);

  // Attempt 1: Amount at the end as digits (e.g. "Taxi 2500")
  const trailingDigits = norm.match(/^(.+?)\s+(\d[\d\s.,]*)$/);
  if (trailingDigits) {
    const descPart = trailingDigits[1].trim();
    const amountPart = trailingDigits[2];
    const amount = parseFrenchNumber(amountPart);
    if (amount > 0) {
      const description = cleanDescription(descPart);
      if (description.length > 0) {
        return { amount, description };
      }
    }
  }

  // Attempt 2: Amount at the start as digits (e.g. "2500 pour le marche")
  const leadingDigits = norm.match(/^(\d[\d\s.,]*)\s+(.+)$/);
  if (leadingDigits) {
    const amountPart = leadingDigits[1];
    const descPart = leadingDigits[2].trim();
    const amount = parseFrenchNumber(amountPart);
    if (amount > 0) {
      const description = cleanDescription(descPart);
      if (description.length > 0) {
        return { amount, description };
      }
    }
  }

  // Attempt 3: French number words at the start
  const tokens = norm.replace(/-/g, ' ').split(/\s+/);

  let splitIdx = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (NUMBER_WORDS.has(tokens[i]) || /^\d+$/.test(tokens[i])) {
      splitIdx = i + 1;
    } else {
      break;
    }
  }

  if (splitIdx > 0 && splitIdx < tokens.length) {
    const amountPart = tokens.slice(0, splitIdx).join(' ');
    const descPart = tokens.slice(splitIdx).join(' ');
    const amount = parseFrenchNumber(amountPart);
    if (amount > 0) {
      const description = cleanDescription(descPart);
      if (description.length > 0) {
        return { amount, description };
      }
    }
  }

  // Attempt 4: Description at the start, French number words at the end
  for (let i = tokens.length - 1; i >= 1; i--) {
    if (NUMBER_WORDS.has(tokens[i]) || /^\d+$/.test(tokens[i])) {
      const amountPart = tokens.slice(i).join(' ');
      const descPart = tokens.slice(0, i).join(' ');
      const amount = parseFrenchNumber(amountPart);
      if (amount > 0) {
        const description = cleanDescription(descPart);
        if (description.length > 0) {
          return { amount, description };
        }
      }
    } else {
      break;
    }
  }

  // Fallback: try to parse entire string as number
  const fullAmount = parseFrenchNumber(norm);
  return { amount: fullAmount, description: '' };
}

function cleanDescription(raw: string): string {
  let desc = raw.trim();
  // Repeatedly strip leading prepositions/articles
  let prev = '';
  while (prev !== desc) {
    prev = desc;
    desc = desc.replace(STRIP_WORDS, '').trim();
  }
  // Capitalize first letter
  if (desc.length > 0) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }
  return desc;
}
