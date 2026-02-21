/**
 * Income source categories for revenue tracking.
 * 8 sources matching the wizard Step2Flows income configuration.
 */
import {
  Briefcase,
  Award,
  Home,
  HandHeart,
  Laptop,
  TrendingUp,
  Shield,
  Package,
} from 'lucide-react-native';

export type IncomeCode =
  | 'salaire'
  | 'primes'
  | 'locatifs'
  | 'aides'
  | 'freelance'
  | 'dividendes'
  | 'pension'
  | 'autres_revenus';

export interface IncomeCategoryConfig {
  code: IncomeCode;
  label: string;
  icon: typeof Briefcase;
  color: string;
  type: 'Fixe' | 'Variable';
}

export const INCOME_CATEGORIES: Record<IncomeCode, IncomeCategoryConfig> = {
  salaire: {
    code: 'salaire',
    label: 'Salaire net',
    icon: Briefcase,
    color: '#60A5FA',
    type: 'Fixe',
  },
  primes: {
    code: 'primes',
    label: 'Primes / Bonus',
    icon: Award,
    color: '#FBBF24',
    type: 'Variable',
  },
  locatifs: {
    code: 'locatifs',
    label: 'Revenus locatifs',
    icon: Home,
    color: '#4ADE80',
    type: 'Fixe',
  },
  aides: {
    code: 'aides',
    label: 'Aides / Allocations',
    icon: HandHeart,
    color: '#A78BFA',
    type: 'Variable',
  },
  freelance: {
    code: 'freelance',
    label: 'Freelance / Missions',
    icon: Laptop,
    color: '#FB923C',
    type: 'Variable',
  },
  dividendes: {
    code: 'dividendes',
    label: 'Dividendes / Interets',
    icon: TrendingUp,
    color: '#34D399',
    type: 'Fixe',
  },
  pension: {
    code: 'pension',
    label: 'Pension',
    icon: Shield,
    color: '#F472B6',
    type: 'Fixe',
  },
  autres_revenus: {
    code: 'autres_revenus',
    label: 'Autres revenus',
    icon: Package,
    color: '#FDE68A',
    type: 'Variable',
  },
};

export const INCOME_CODES: IncomeCode[] = [
  'salaire',
  'primes',
  'locatifs',
  'aides',
  'freelance',
  'dividendes',
  'pension',
  'autres_revenus',
];
