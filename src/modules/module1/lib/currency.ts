/**
 * Système de gestion des devises
 * Support multi-devises avec affichage dynamique
 */

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  symbol: string;
  code: string;
  decimals: number;
  thousandSeparator: string;
  decimalSeparator: string;
  position: 'before' | 'after';
}

export const CURRENCY_CONFIG: Record<Currency, CurrencyConfig> = {
  USD: {
    symbol: '$',
    code: 'USD',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    position: 'before'
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    position: 'after'
  },
  GBP: {
    symbol: '£',
    code: 'GBP',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    position: 'before'
  },
  JPY: {
    symbol: '¥',
    code: 'JPY',
    decimals: 0,
    thousandSeparator: ',',
    decimalSeparator: '.',
    position: 'before'
  },
  CAD: {
    symbol: 'C$',
    code: 'CAD',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    position: 'before'
  },
  AUD: {
    symbol: 'A$',
    code: 'AUD',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    position: 'before'
  }
};

/**
 * Formate un montant selon la devise sélectionnée
 */
export function formatCurrency(amount: number, currency: Currency = 'EUR'): string {
  const config = CURRENCY_CONFIG[currency];
  
  if (isNaN(amount)) return `${config.symbol}0.00`;
  
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals
  });
  
  // Remplacer les séparateurs selon la devise
  let finalNumber = formattedNumber;
  if (config.decimalSeparator !== '.') {
    finalNumber = finalNumber.replace('.', config.decimalSeparator);
  }
  if (config.thousandSeparator !== ',') {
    finalNumber = finalNumber.replace(/,/g, config.thousandSeparator);
  }
  
  return config.position === 'before' 
    ? `${config.symbol}${finalNumber}`
    : `${finalNumber} ${config.symbol}`;
}

/**
 * Formate un montant avec le code devise
 */
export function formatCurrencyWithCode(amount: number, currency: Currency = 'EUR'): string {
  const config = CURRENCY_CONFIG[currency];
  return `${formatCurrency(amount, currency)} ${config.code}`;
}

/**
 * Hook React pour gérer la devise courante
 */
export function useCurrency() {
  // Pour l'instant, retourne EUR par défaut
  // Peut être étendu avec un contexte ou un store
  return {
    currency: 'EUR' as Currency,
    format: (amount: number) => formatCurrency(amount, 'EUR'),
    formatWithCode: (amount: number) => formatCurrencyWithCode(amount, 'EUR')
  };
}

/**
 * Utilitaire pour formater les montants dans les composants
 */
export function createCurrencyFormatter(currency: Currency) {
  return {
    format: (amount: number) => formatCurrency(amount, currency),
    formatWithCode: (amount: number) => formatCurrencyWithCode(amount, currency)
  };
}
