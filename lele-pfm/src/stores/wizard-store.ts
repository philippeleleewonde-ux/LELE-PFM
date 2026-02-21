import { create } from 'zustand';

export interface FinancialHistoryEntry {
  year: number;
  income: number;
  expenses: number;
}

// Revenu enrichi — parallèle HCM (CA par ligne métier avec type, fréquence, probabilité, croissance)
export interface IncomeEntry {
  amount: number;
  frequency: 'monthly' | 'annual';
  probability: number;   // 0-100 (certitude du revenu)
  growthRate: number;     // % annuel (progression)
  type: 'Fixe' | 'Variable';
}

// Dépense enrichie — parallèle HCM BusinessLine (type, nature, élasticité)
export interface ExpenseEntry {
  amount: number;
  frequency: 'monthly' | 'annual';
  type: 'Fixe' | 'Variable';
  nature: 'Essentielle' | 'Discrétionnaire';
  elasticity: number; // 0-100 (potentiel de compression)
}

export interface WizardFormData {
  // Page 1 - Profil
  job: string;
  age: string;
  dependents: string;
  situation: string;
  country: string;              // ISO 3166-1 alpha-2 (ex: 'CI', 'FR', 'NG')
  currency: string;             // Devise choisie (ex: 'FCFA', 'EUR', 'USD')
  urbanRural: 'urban' | 'rural';
  extendedFamilyObligations: boolean; // Obligations familiales élargies
  // Page 2 - Revenus & Dépenses
  incomeSource: 'formal' | 'mixed' | 'informal' | 'seasonal';
  incomes: Record<string, IncomeEntry>;
  expenses: Record<string, ExpenseEntry>;
  // Page 3 - Historique
  history: FinancialHistoryEntry[];
  engagementLevel: string;
  // Page 4 - Risques
  risks: Record<string, number>;
  // Page 5 - Auto-éval
  ratings: number[];
  // Page 6 - Leviers
  levers: Record<string, number>;
}

interface WizardState {
  currentStep: number;
  formData: WizardFormData;
  setStep: (step: number) => void;
  updateFormData: (partial: Partial<WizardFormData>) => void;
  resetWizard: () => void;
}

const currentYear = new Date().getFullYear();

const initialFormData: WizardFormData = {
  job: '',
  age: '',
  dependents: '',
  situation: '',
  country: 'CI',
  currency: 'FCFA',
  urbanRural: 'urban' as const,
  extendedFamilyObligations: false,
  incomeSource: 'formal' as const,
  incomes: {},
  expenses: {},
  history: [
    { year: currentYear - 4, income: 0, expenses: 0 },  // N-4
    { year: currentYear - 3, income: 0, expenses: 0 },  // N-3
    { year: currentYear - 2, income: 0, expenses: 0 },  // N-2
    { year: currentYear - 1, income: 0, expenses: 0 },  // N-1
    { year: currentYear, income: 0, expenses: 0 },      // N
  ],
  engagementLevel: '',
  risks: {},
  ratings: [0, 0, 0, 0, 0],
  levers: {},
};

export const useWizardStore = create<WizardState>()((set) => ({
  currentStep: 0,
  formData: { ...initialFormData },

  setStep: (step) => set({ currentStep: step }),

  updateFormData: (partial) =>
    set((state) => ({
      formData: { ...state.formData, ...partial },
    })),

  resetWizard: () =>
    set({
      currentStep: 0,
      formData: { ...initialFormData },
    }),
}));
