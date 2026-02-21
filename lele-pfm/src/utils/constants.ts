import { COICOPCode } from '../types';

export const COICOP_CATEGORIES: Array<{ code: COICOPCode; label: string; icon: string }> = [
  { code: '01', label: 'Food & Beverages', icon: 'utensils' },
  { code: '02', label: 'Clothing & Footwear', icon: 'shirt' },
  { code: '03', label: 'Housing & Utilities', icon: 'home' },
  { code: '04', label: 'Health', icon: 'heart' },
  { code: '05', label: 'Transport', icon: 'car' },
  { code: '06', label: 'Communications', icon: 'phone' },
  { code: '07', label: 'Recreation & Culture', icon: 'film' },
  { code: '08', label: 'Education', icon: 'book' },
];

export const TRANSACTION_TYPES = ['Fixe', 'Variable', 'Imprévue', 'Épargne-Dette'];

export const PAYMENT_METHODS = ['CarteBancaire', 'Espèces', 'Virement', 'Prélèvement'];

export const PROFILE_TYPES = [
  'Salarié',
  'Freelance',
  'Entrepreneur',
  'Retraité',
  'Étudiant',
  'Fonctionnaire',
  'Intérimaire',
  'Artisan',
  'Agriculteur',
  'Profession_Libérale',
  'Cadre_Dirigeant',
  'Sans_Emploi',
];

export const GRADE_THRESHOLDS = {
  'A+': { min: 95, max: 100 },
  A: { min: 85, max: 94.99 },
  B: { min: 75, max: 84.99 },
  C: { min: 60, max: 74.99 },
  D: { min: 45, max: 59.99 },
  E: { min: 0, max: 44.99 },
};

export const MAX_LEVERS = 6;

export const WEEKS_PER_YEAR = 52;

export const DEFAULT_WATERFALL_CONFIG = {
  p1: 30,
  p2: 35,
  p3: 20,
  p4: 15,
};

export const ENGINE_PERFORMANCE_TARGET_MS = 500;
