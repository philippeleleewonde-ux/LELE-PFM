import { NumberParser } from './types';
import { frParser } from './fr';
import { enParser } from './en';
import { esParser } from './es';
import { ptParser } from './pt';

const parsers: Record<string, NumberParser> = {
  fr: frParser,
  en: enParser,
  es: esParser,
  pt: ptParser,
};

export function getNumberParser(lang: string): NumberParser {
  return parsers[lang] ?? frParser;
}

export type { NumberParser } from './types';
