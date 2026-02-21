/**
 * Country Risk Profiles — Conformité internationale UL
 *
 * CALIBRATION : Février 2026
 * PROCHAINE REVISION : Février 2027
 *
 * Sources :
 * - Banque Mondiale (classification par revenu GNI/hab 2024)
 * - Bâle III (corrélation plancher ρ=0.03-0.24 pour expositions corporate, adapté ménages)
 * - OIT/ILO (indice de protection sociale)
 * - FMI (volatilité devise, inflation moyenne 5 ans — données WEO Oct 2025)
 * - Findex (Banque Mondiale, taux de bancarisation)
 *
 * ρ (rho) : corrélation revenus/dépenses
 *   - Élevé = quand le revenu baisse, les dépenses ne baissent pas (charges fixes)
 *   - Faible = filets sociaux amortissent les chocs
 *
 * countryFactor : multiplicateur macro du coefficient contextuel
 *   Composite : inflation + stabilité devise + protection sociale + bancarisation
 */

export type WorldBankIncomeClass = 'high' | 'upper_middle' | 'lower_middle' | 'low';
export type UrbanRural = 'urban' | 'rural';
export type IncomeSource = 'formal' | 'mixed' | 'informal' | 'seasonal';

import { AssetClass } from '@/types/investment';

export interface CountryRiskProfile {
  code: string;           // ISO 3166-1 alpha-2
  name: string;           // Nom FR
  rho: number;            // Corrélation revenus/dépenses (0.15-0.70)
  countryFactor: number;  // Multiplicateur macro (0.80-1.40)
  wbClass: WorldBankIncomeClass;
  currency: string;       // Devise principale
  inflationAvg5y: number; // Inflation moyenne 5 ans (%)
  // Investment enrichment
  investmentInfraLevel: 1 | 2 | 3 | 4; // 1=developed, 4=fragile
  shariaRelevant: boolean;
  localBenchmarkReturn: number; // Local benchmark return (%)
  savingsAccountRate: number;   // Savings account rate (%)
  currencyVolatility: 'low' | 'medium' | 'high';
  availableAssets: AssetClass[];
  taxAdvantageAccounts: string[];
}

// ===== PROFILS PAR PAYS =====

// ─── Investment defaults by World Bank class ───
const INVEST_DEFAULTS: Record<WorldBankIncomeClass, Pick<CountryRiskProfile, 'investmentInfraLevel' | 'localBenchmarkReturn' | 'savingsAccountRate' | 'currencyVolatility'>> = {
  high:         { investmentInfraLevel: 1, localBenchmarkReturn: 7, savingsAccountRate: 2, currencyVolatility: 'low' },
  upper_middle: { investmentInfraLevel: 2, localBenchmarkReturn: 8, savingsAccountRate: 4, currencyVolatility: 'medium' },
  lower_middle: { investmentInfraLevel: 3, localBenchmarkReturn: 6, savingsAccountRate: 3, currencyVolatility: 'medium' },
  low:          { investmentInfraLevel: 4, localBenchmarkReturn: 5, savingsAccountRate: 3, currencyVolatility: 'high' },
};

const UEMOA_ASSETS: AssetClass[] = ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'tontine', 'money_market', 'mutual_fund'];
const CEMAC_ASSETS: AssetClass[] = ['savings_account', 'term_deposit', 'government_bonds', 'real_estate_fund', 'money_market'];
const DEV_ASSETS: AssetClass[] = ['savings_account', 'term_deposit', 'government_bonds', 'corporate_bonds', 'stock_index', 'real_estate_fund', 'gold', 'money_market', 'mutual_fund'];
const ISLAMIC_ASSETS: AssetClass[] = ['savings_account', 'term_deposit', 'sukuk', 'gold', 'real_estate_fund', 'mutual_fund'];

export const COUNTRY_RISK_PROFILES: Record<string, CountryRiskProfile> = {
  // --- Afrique de l'Ouest (UEMOA - Zone Franc CFA) ---
  'CI': { code: 'CI', name: 'Côte d\'Ivoire', rho: 0.42, countryFactor: 1.05, wbClass: 'lower_middle', currency: 'XOF', inflationAvg5y: 3.2, investmentInfraLevel: 3, shariaRelevant: true, localBenchmarkReturn: 8, savingsAccountRate: 3.5, currencyVolatility: 'low', availableAssets: UEMOA_ASSETS, taxAdvantageAccounts: [] },
  'SN': { code: 'SN', name: 'Sénégal', rho: 0.45, countryFactor: 1.08, wbClass: 'lower_middle', currency: 'XOF', inflationAvg5y: 3.5, investmentInfraLevel: 3, shariaRelevant: true, localBenchmarkReturn: 7, savingsAccountRate: 3.5, currencyVolatility: 'low', availableAssets: UEMOA_ASSETS, taxAdvantageAccounts: [] },
  'ML': { code: 'ML', name: 'Mali', rho: 0.55, countryFactor: 1.22, wbClass: 'low', currency: 'XOF', inflationAvg5y: 4.1, investmentInfraLevel: 4, shariaRelevant: true, localBenchmarkReturn: 5, savingsAccountRate: 3.5, currencyVolatility: 'low', availableAssets: ['savings_account', 'term_deposit', 'tontine', 'government_bonds'], taxAdvantageAccounts: [] },
  'BF': { code: 'BF', name: 'Burkina Faso', rho: 0.55, countryFactor: 1.20, wbClass: 'low', currency: 'XOF', inflationAvg5y: 4.0, investmentInfraLevel: 4, shariaRelevant: true, localBenchmarkReturn: 5, savingsAccountRate: 3.5, currencyVolatility: 'low', availableAssets: ['savings_account', 'term_deposit', 'tontine', 'government_bonds'], taxAdvantageAccounts: [] },
  'NE': { code: 'NE', name: 'Niger', rho: 0.60, countryFactor: 1.28, wbClass: 'low', currency: 'XOF', inflationAvg5y: 4.5, investmentInfraLevel: 4, shariaRelevant: true, localBenchmarkReturn: 5, savingsAccountRate: 3.5, currencyVolatility: 'low', availableAssets: ['savings_account', 'tontine'], taxAdvantageAccounts: [] },
  'TG': { code: 'TG', name: 'Togo', rho: 0.48, countryFactor: 1.12, wbClass: 'low', currency: 'XOF', inflationAvg5y: 3.8, investmentInfraLevel: 4, shariaRelevant: false, localBenchmarkReturn: 5, savingsAccountRate: 3.5, currencyVolatility: 'low', availableAssets: ['savings_account', 'term_deposit', 'tontine', 'government_bonds'], taxAdvantageAccounts: [] },
  'BJ': { code: 'BJ', name: 'Bénin', rho: 0.45, countryFactor: 1.08, wbClass: 'lower_middle', currency: 'XOF', inflationAvg5y: 3.0, investmentInfraLevel: 3, shariaRelevant: false, localBenchmarkReturn: 6, savingsAccountRate: 3.5, currencyVolatility: 'low', availableAssets: UEMOA_ASSETS, taxAdvantageAccounts: [] },
  'GW': { code: 'GW', name: 'Guinée-Bissau', rho: 0.58, countryFactor: 1.25, wbClass: 'low', currency: 'XOF', inflationAvg5y: 4.2, investmentInfraLevel: 4, shariaRelevant: false, localBenchmarkReturn: 4, savingsAccountRate: 3.5, currencyVolatility: 'low', availableAssets: ['savings_account', 'tontine'], taxAdvantageAccounts: [] },

  // --- Afrique Centrale (CEMAC - Zone Franc CFA) ---
  'CM': { code: 'CM', name: 'Cameroun', rho: 0.45, countryFactor: 1.08, wbClass: 'lower_middle', currency: 'XAF', inflationAvg5y: 3.5, investmentInfraLevel: 3, shariaRelevant: true, localBenchmarkReturn: 6, savingsAccountRate: 3, currencyVolatility: 'low', availableAssets: CEMAC_ASSETS, taxAdvantageAccounts: [] },
  'GA': { code: 'GA', name: 'Gabon', rho: 0.38, countryFactor: 0.98, wbClass: 'upper_middle', currency: 'XAF', inflationAvg5y: 2.8, investmentInfraLevel: 3, shariaRelevant: false, localBenchmarkReturn: 6, savingsAccountRate: 3, currencyVolatility: 'low', availableAssets: CEMAC_ASSETS, taxAdvantageAccounts: [] },
  'CG': { code: 'CG', name: 'Congo-Brazzaville', rho: 0.48, countryFactor: 1.12, wbClass: 'lower_middle', currency: 'XAF', inflationAvg5y: 3.5, investmentInfraLevel: 3, shariaRelevant: false, localBenchmarkReturn: 5, savingsAccountRate: 3, currencyVolatility: 'low', availableAssets: CEMAC_ASSETS, taxAdvantageAccounts: [] },
  'TD': { code: 'TD', name: 'Tchad', rho: 0.60, countryFactor: 1.30, wbClass: 'low', currency: 'XAF', inflationAvg5y: 5.0, investmentInfraLevel: 4, shariaRelevant: true, localBenchmarkReturn: 4, savingsAccountRate: 3, currencyVolatility: 'low', availableAssets: ['savings_account', 'term_deposit'], taxAdvantageAccounts: [] },
  'CF': { code: 'CF', name: 'Centrafrique', rho: 0.62, countryFactor: 1.35, wbClass: 'low', currency: 'XAF', inflationAvg5y: 5.5, investmentInfraLevel: 4, shariaRelevant: false, localBenchmarkReturn: 4, savingsAccountRate: 3, currencyVolatility: 'low', availableAssets: ['savings_account'], taxAdvantageAccounts: [] },
  'GQ': { code: 'GQ', name: 'Guinée équatoriale', rho: 0.40, countryFactor: 1.05, wbClass: 'upper_middle', currency: 'XAF', inflationAvg5y: 3.0, investmentInfraLevel: 3, shariaRelevant: false, localBenchmarkReturn: 5, savingsAccountRate: 3, currencyVolatility: 'low', availableAssets: CEMAC_ASSETS, taxAdvantageAccounts: [] },

  // --- Afrique (hors zone franc) ---
  'NG': { code: 'NG', name: 'Nigeria', rho: 0.50, countryFactor: 1.20, wbClass: 'lower_middle', currency: 'NGN', inflationAvg5y: 18.0, investmentInfraLevel: 2, shariaRelevant: true, localBenchmarkReturn: 12, savingsAccountRate: 5, currencyVolatility: 'high', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'crypto', 'money_market', 'mutual_fund', 'sukuk'], taxAdvantageAccounts: [] },
  'GH': { code: 'GH', name: 'Ghana', rho: 0.48, countryFactor: 1.18, wbClass: 'lower_middle', currency: 'GHS', inflationAvg5y: 15.0, investmentInfraLevel: 2, shariaRelevant: false, localBenchmarkReturn: 10, savingsAccountRate: 8, currencyVolatility: 'high', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'money_market', 'mutual_fund'], taxAdvantageAccounts: [] },
  'KE': { code: 'KE', name: 'Kenya', rho: 0.45, countryFactor: 1.10, wbClass: 'lower_middle', currency: 'KES', inflationAvg5y: 7.5, investmentInfraLevel: 2, shariaRelevant: true, localBenchmarkReturn: 10, savingsAccountRate: 6, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'money_market', 'mutual_fund', 'real_estate_fund'], taxAdvantageAccounts: [] },
  'ZA': { code: 'ZA', name: 'Afrique du Sud', rho: 0.35, countryFactor: 1.02, wbClass: 'upper_middle', currency: 'ZAR', inflationAvg5y: 5.5, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 10, savingsAccountRate: 5, currencyVolatility: 'medium', availableAssets: [...DEV_ASSETS, 'local_stocks'], taxAdvantageAccounts: ['TFSA'] },
  'CD': { code: 'CD', name: 'RD Congo', rho: 0.62, countryFactor: 1.35, wbClass: 'low', currency: 'CDF', inflationAvg5y: 12.0, investmentInfraLevel: 4, shariaRelevant: false, localBenchmarkReturn: 5, savingsAccountRate: 3, currencyVolatility: 'high', availableAssets: ['savings_account', 'micro_enterprise'], taxAdvantageAccounts: [] },
  'GN': { code: 'GN', name: 'Guinée-Conakry', rho: 0.52, countryFactor: 1.18, wbClass: 'low', currency: 'GNF', inflationAvg5y: 10.0, investmentInfraLevel: 4, shariaRelevant: true, localBenchmarkReturn: 5, savingsAccountRate: 3, currencyVolatility: 'high', availableAssets: ['savings_account', 'tontine', 'micro_enterprise'], taxAdvantageAccounts: [] },
  'ET': { code: 'ET', name: 'Éthiopie', rho: 0.55, countryFactor: 1.25, wbClass: 'low', currency: 'ETB', inflationAvg5y: 20.0, investmentInfraLevel: 3, shariaRelevant: true, localBenchmarkReturn: 8, savingsAccountRate: 7, currencyVolatility: 'high', availableAssets: ['savings_account', 'term_deposit', 'government_bonds'], taxAdvantageAccounts: [] },
  'TZ': { code: 'TZ', name: 'Tanzanie', rho: 0.48, countryFactor: 1.12, wbClass: 'lower_middle', currency: 'TZS', inflationAvg5y: 4.5, investmentInfraLevel: 3, shariaRelevant: true, localBenchmarkReturn: 7, savingsAccountRate: 4, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks'], taxAdvantageAccounts: [] },
  'RW': { code: 'RW', name: 'Rwanda', rho: 0.42, countryFactor: 1.05, wbClass: 'low', currency: 'RWF', inflationAvg5y: 8.0, investmentInfraLevel: 3, shariaRelevant: false, localBenchmarkReturn: 7, savingsAccountRate: 5, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks'], taxAdvantageAccounts: [] },

  // --- Maghreb ---
  'MA': { code: 'MA', name: 'Maroc', rho: 0.35, countryFactor: 1.00, wbClass: 'lower_middle', currency: 'MAD', inflationAvg5y: 3.0, investmentInfraLevel: 2, shariaRelevant: true, localBenchmarkReturn: 8, savingsAccountRate: 3, currencyVolatility: 'low', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'real_estate_fund', 'mutual_fund', 'sukuk'], taxAdvantageAccounts: ['PEA Maroc'] },
  'TN': { code: 'TN', name: 'Tunisie', rho: 0.38, countryFactor: 1.05, wbClass: 'lower_middle', currency: 'TND', inflationAvg5y: 7.0, investmentInfraLevel: 2, shariaRelevant: true, localBenchmarkReturn: 7, savingsAccountRate: 5, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'mutual_fund', 'sukuk'], taxAdvantageAccounts: ['CEA'] },
  'DZ': { code: 'DZ', name: 'Algérie', rho: 0.40, countryFactor: 1.08, wbClass: 'lower_middle', currency: 'DZD', inflationAvg5y: 6.0, investmentInfraLevel: 3, shariaRelevant: true, localBenchmarkReturn: 5, savingsAccountRate: 3, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'sukuk'], taxAdvantageAccounts: [] },

  // --- Europe ---
  'FR': { code: 'FR', name: 'France', rho: 0.22, countryFactor: 0.88, wbClass: 'high', currency: 'EUR', inflationAvg5y: 3.5, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 7, savingsAccountRate: 3, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['PEA', 'Assurance Vie', 'Livret A', 'LDDS'] },
  'BE': { code: 'BE', name: 'Belgique', rho: 0.20, countryFactor: 0.86, wbClass: 'high', currency: 'EUR', inflationAvg5y: 3.8, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 7, savingsAccountRate: 1, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['Épargne-pension'] },
  'CH': { code: 'CH', name: 'Suisse', rho: 0.18, countryFactor: 0.82, wbClass: 'high', currency: 'CHF', inflationAvg5y: 1.5, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 6, savingsAccountRate: 1, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['Pilier 3a'] },
  'DE': { code: 'DE', name: 'Allemagne', rho: 0.20, countryFactor: 0.85, wbClass: 'high', currency: 'EUR', inflationAvg5y: 3.5, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 7, savingsAccountRate: 1, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['Riester-Rente'] },
  'GB': { code: 'GB', name: 'Royaume-Uni', rho: 0.22, countryFactor: 0.88, wbClass: 'high', currency: 'GBP', inflationAvg5y: 4.5, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 8, savingsAccountRate: 4, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['ISA', 'SIPP'] },
  'IT': { code: 'IT', name: 'Italie', rho: 0.25, countryFactor: 0.90, wbClass: 'high', currency: 'EUR', inflationAvg5y: 3.0, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 6, savingsAccountRate: 1, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['PIR'] },
  'ES': { code: 'ES', name: 'Espagne', rho: 0.25, countryFactor: 0.90, wbClass: 'high', currency: 'EUR', inflationAvg5y: 3.5, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 7, savingsAccountRate: 1, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['Plan de Pensiones'] },
  'PT': { code: 'PT', name: 'Portugal', rho: 0.28, countryFactor: 0.92, wbClass: 'high', currency: 'EUR', inflationAvg5y: 3.0, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 6, savingsAccountRate: 1, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['PPR'] },

  // --- Amériques ---
  'US': { code: 'US', name: 'États-Unis', rho: 0.20, countryFactor: 0.88, wbClass: 'high', currency: 'USD', inflationAvg5y: 4.0, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 10, savingsAccountRate: 4.5, currencyVolatility: 'low', availableAssets: [...DEV_ASSETS, 'crypto'], taxAdvantageAccounts: ['401k', 'Roth IRA', 'HSA'] },
  'CA': { code: 'CA', name: 'Canada', rho: 0.20, countryFactor: 0.85, wbClass: 'high', currency: 'CAD', inflationAvg5y: 3.5, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 8, savingsAccountRate: 4, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['TFSA', 'RRSP'] },
  'BR': { code: 'BR', name: 'Brésil', rho: 0.40, countryFactor: 1.12, wbClass: 'upper_middle', currency: 'BRL', inflationAvg5y: 6.5, investmentInfraLevel: 2, shariaRelevant: false, localBenchmarkReturn: 12, savingsAccountRate: 8, currencyVolatility: 'high', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'stock_index', 'local_stocks', 'real_estate_fund', 'mutual_fund'], taxAdvantageAccounts: ['Tesouro Direto'] },
  'MX': { code: 'MX', name: 'Mexique', rho: 0.38, countryFactor: 1.08, wbClass: 'upper_middle', currency: 'MXN', inflationAvg5y: 5.5, investmentInfraLevel: 2, shariaRelevant: false, localBenchmarkReturn: 10, savingsAccountRate: 7, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'stock_index', 'local_stocks', 'mutual_fund'], taxAdvantageAccounts: ['Afore'] },
  'HT': { code: 'HT', name: 'Haïti', rho: 0.60, countryFactor: 1.35, wbClass: 'low', currency: 'HTG', inflationAvg5y: 25.0, investmentInfraLevel: 4, shariaRelevant: false, localBenchmarkReturn: 5, savingsAccountRate: 2, currencyVolatility: 'high', availableAssets: ['savings_account', 'micro_enterprise', 'tontine'], taxAdvantageAccounts: [] },

  // --- Asie ---
  'IN': { code: 'IN', name: 'Inde', rho: 0.45, countryFactor: 1.10, wbClass: 'lower_middle', currency: 'INR', inflationAvg5y: 5.5, investmentInfraLevel: 2, shariaRelevant: true, localBenchmarkReturn: 12, savingsAccountRate: 4, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'stock_index', 'local_stocks', 'gold', 'mutual_fund', 'real_estate_fund'], taxAdvantageAccounts: ['PPF', 'ELSS', 'NPS'] },
  'CN': { code: 'CN', name: 'Chine', rho: 0.30, countryFactor: 0.95, wbClass: 'upper_middle', currency: 'CNY', inflationAvg5y: 1.5, investmentInfraLevel: 2, shariaRelevant: false, localBenchmarkReturn: 6, savingsAccountRate: 1.5, currencyVolatility: 'low', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'stock_index', 'local_stocks', 'gold', 'real_estate_fund', 'money_market'], taxAdvantageAccounts: [] },
  'JP': { code: 'JP', name: 'Japon', rho: 0.18, countryFactor: 0.82, wbClass: 'high', currency: 'JPY', inflationAvg5y: 2.0, investmentInfraLevel: 1, shariaRelevant: false, localBenchmarkReturn: 7, savingsAccountRate: 0.2, currencyVolatility: 'low', availableAssets: DEV_ASSETS, taxAdvantageAccounts: ['NISA', 'iDeCo'] },
  'VN': { code: 'VN', name: 'Vietnam', rho: 0.42, countryFactor: 1.05, wbClass: 'lower_middle', currency: 'VND', inflationAvg5y: 3.5, investmentInfraLevel: 3, shariaRelevant: false, localBenchmarkReturn: 10, savingsAccountRate: 5, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'gold'], taxAdvantageAccounts: [] },
  'PH': { code: 'PH', name: 'Philippines', rho: 0.45, countryFactor: 1.10, wbClass: 'lower_middle', currency: 'PHP', inflationAvg5y: 4.5, investmentInfraLevel: 2, shariaRelevant: true, localBenchmarkReturn: 8, savingsAccountRate: 3, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'mutual_fund'], taxAdvantageAccounts: ['PERA'] },
  'BD': { code: 'BD', name: 'Bangladesh', rho: 0.50, countryFactor: 1.15, wbClass: 'lower_middle', currency: 'BDT', inflationAvg5y: 7.0, investmentInfraLevel: 3, shariaRelevant: true, localBenchmarkReturn: 7, savingsAccountRate: 5, currencyVolatility: 'medium', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'sukuk'], taxAdvantageAccounts: [] },
  'PK': { code: 'PK', name: 'Pakistan', rho: 0.52, countryFactor: 1.22, wbClass: 'lower_middle', currency: 'PKR', inflationAvg5y: 15.0, investmentInfraLevel: 3, shariaRelevant: true, localBenchmarkReturn: 10, savingsAccountRate: 12, currencyVolatility: 'high', availableAssets: ['savings_account', 'term_deposit', 'government_bonds', 'local_stocks', 'gold', 'sukuk', 'mutual_fund'], taxAdvantageAccounts: [] },
  'LB': { code: 'LB', name: 'Liban', rho: 0.55, countryFactor: 1.30, wbClass: 'lower_middle', currency: 'LBP', inflationAvg5y: 80.0, investmentInfraLevel: 4, shariaRelevant: true, localBenchmarkReturn: 5, savingsAccountRate: 1, currencyVolatility: 'high', availableAssets: ['savings_account', 'gold', 'crypto'], taxAdvantageAccounts: [] },

  // --- Moyen-Orient ---
  'AE': { code: 'AE', name: 'Émirats arabes unis', rho: 0.22, countryFactor: 0.85, wbClass: 'high', currency: 'AED', inflationAvg5y: 2.5, investmentInfraLevel: 1, shariaRelevant: true, localBenchmarkReturn: 8, savingsAccountRate: 4, currencyVolatility: 'low', availableAssets: [...DEV_ASSETS, 'sukuk', 'crypto'], taxAdvantageAccounts: [] },
  'SA': { code: 'SA', name: 'Arabie saoudite', rho: 0.25, countryFactor: 0.88, wbClass: 'high', currency: 'SAR', inflationAvg5y: 2.5, investmentInfraLevel: 1, shariaRelevant: true, localBenchmarkReturn: 8, savingsAccountRate: 4, currencyVolatility: 'low', availableAssets: [...DEV_ASSETS, 'sukuk'], taxAdvantageAccounts: [] },
};

// ===== FALLBACK PAR CLASSIFICATION BANQUE MONDIALE =====

export const WB_CLASS_DEFAULTS: Record<WorldBankIncomeClass, { rho: number; countryFactor: number }> = {
  'high':         { rho: 0.22, countryFactor: 0.88 },
  'upper_middle': { rho: 0.35, countryFactor: 1.02 },
  'lower_middle': { rho: 0.45, countryFactor: 1.10 },
  'low':          { rho: 0.58, countryFactor: 1.28 },
};

// ===== FACTEURS CONTEXTUELS =====

export const URBAN_RURAL_FACTORS: Record<UrbanRural, number> = {
  'urban': 0.95,    // Accès services, emploi diversifié, infrastructure
  'rural': 1.10,    // Mono-activité, accès limité, dépendance climatique
};

export const INCOME_SOURCE_FACTORS: Record<IncomeSource, number> = {
  'formal':   1.00,  // Salaire fixe, contrat, bulletins → données fiables
  'mixed':    1.10,  // Salaire + activité annexe informelle
  'informal': 1.25,  // Commerce, artisanat, pas de trace bancaire → volatilité élevée
  'seasonal': 1.30,  // Agriculture, tourisme, BTP → forte saisonnalité
};

export const EXTENDED_FAMILY_FACTOR = 1.08; // +8% si obligations familiales élargies

// ===== HELPER =====

/**
 * Retourne le profil de risque pays.
 * Si le pays n'est pas dans la table, fallback sur la classification Banque Mondiale.
 * Si aucune classification, fallback sur lower_middle (le plus représenté mondialement).
 */
export function getCountryRiskProfile(
  countryCode: string,
  wbClassOverride?: WorldBankIncomeClass
): { rho: number; countryFactor: number } {
  const profile = COUNTRY_RISK_PROFILES[countryCode.toUpperCase()];
  if (profile) {
    return { rho: profile.rho, countryFactor: profile.countryFactor };
  }

  const wbClass = wbClassOverride ?? 'lower_middle';
  return WB_CLASS_DEFAULTS[wbClass];
}

/**
 * Get full country profile including investment data.
 * Falls back to WB class defaults if country not found.
 */
export function getFullCountryProfile(
  countryCode: string,
  wbClassOverride?: WorldBankIncomeClass,
): CountryRiskProfile | null {
  const profile = COUNTRY_RISK_PROFILES[countryCode.toUpperCase()];
  if (profile) return profile;
  return null;
}

/**
 * Get investment defaults for a given World Bank class.
 */
export function getInvestmentDefaults(wbClass: WorldBankIncomeClass) {
  return INVEST_DEFAULTS[wbClass];
}
