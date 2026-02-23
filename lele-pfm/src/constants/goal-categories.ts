/**
 * Savings goal project categories.
 * 10 categories with lucide icon + color + label.
 */
import {
  Plane,
  Home,
  Car,
  GraduationCap,
  Gift,
  Smartphone,
  Heart,
  Gem,
  Umbrella,
  Target,
} from 'lucide-react-native';

export type GoalIcon =
  | 'voyage'
  | 'maison'
  | 'voiture'
  | 'education'
  | 'cadeau'
  | 'tech'
  | 'sante'
  | 'luxe'
  | 'urgence'
  | 'autre';

export interface GoalCategoryConfig {
  code: GoalIcon;
  /** i18n key — use t(`tracking:${label}`) to get translated text */
  label: string;
  icon: typeof Plane;
  color: string;
}

export const GOAL_CATEGORIES: Record<GoalIcon, GoalCategoryConfig> = {
  voyage: {
    code: 'voyage',
    label: 'goalCategories.voyage',
    icon: Plane,
    color: '#60A5FA',
  },
  maison: {
    code: 'maison',
    label: 'goalCategories.maison',
    icon: Home,
    color: '#4ADE80',
  },
  voiture: {
    code: 'voiture',
    label: 'goalCategories.voiture',
    icon: Car,
    color: '#FBBF24',
  },
  education: {
    code: 'education',
    label: 'goalCategories.education',
    icon: GraduationCap,
    color: '#A78BFA',
  },
  cadeau: {
    code: 'cadeau',
    label: 'goalCategories.cadeau',
    icon: Gift,
    color: '#FB923C',
  },
  tech: {
    code: 'tech',
    label: 'goalCategories.tech',
    icon: Smartphone,
    color: '#22D3EE',
  },
  sante: {
    code: 'sante',
    label: 'goalCategories.sante',
    icon: Heart,
    color: '#F472B6',
  },
  luxe: {
    code: 'luxe',
    label: 'goalCategories.luxe',
    icon: Gem,
    color: '#FDE68A',
  },
  urgence: {
    code: 'urgence',
    label: 'goalCategories.urgence',
    icon: Umbrella,
    color: '#34D399',
  },
  autre: {
    code: 'autre',
    label: 'goalCategories.autre',
    icon: Target,
    color: '#A1A1AA',
  },
};

export const GOAL_ICON_CODES: GoalIcon[] = [
  'voyage',
  'maison',
  'voiture',
  'education',
  'cadeau',
  'tech',
  'sante',
  'luxe',
  'urgence',
  'autre',
];
