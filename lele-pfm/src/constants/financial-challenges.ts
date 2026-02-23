/**
 * Financial Challenges — Plan annuel de 48 defis (Savoir -> Faire -> Maitriser)
 * 4 trimestres x 3 modules x 4 semaines
 * Alimente le levier LIT du score financier dynamique.
 *
 * i18n: Text fields (moduleTitle, savoir, faire, maitriserDesc) store translation
 * KEYS from the 'challenges' namespace. Components call t(`challenges:${key}`)
 * to get the translated text.
 */

export interface FinancialChallenge {
  id: string;
  week: number;
  quarter: 1 | 2 | 3 | 4;
  module: number;
  /** i18n key — use t(`challenges:${moduleTitle}`) */
  moduleTitle: string;
  difficulty: 'decouverte' | 'intermediaire' | 'avance' | 'expert';
  /** i18n key — use t(`challenges:${savoir}`) */
  savoir: string;
  /** i18n key — use t(`challenges:${faire}`) */
  faire: string;
  /** i18n key — use t(`challenges:${maitriserDesc}`) */
  maitriserDesc: string;
  conditionKey: string;
  points: { savoir: number; faire: number; maitriser: number };
}

// --- T1: LES FONDATIONS (S1-S12) ---

const MODULE_1: FinancialChallenge[] = [
  {
    id: 'S1', week: 1, quarter: 1, module: 1,
    moduleTitle: 'modules.1',
    difficulty: 'decouverte',
    savoir: 'S1.savoir',
    faire: 'S1.faire',
    maitriserDesc: 'S1.maitriserDesc',
    conditionKey: 'S1',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S2', week: 2, quarter: 1, module: 1,
    moduleTitle: 'modules.1',
    difficulty: 'decouverte',
    savoir: 'S2.savoir',
    faire: 'S2.faire',
    maitriserDesc: 'S2.maitriserDesc',
    conditionKey: 'S2',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S3', week: 3, quarter: 1, module: 1,
    moduleTitle: 'modules.1',
    difficulty: 'decouverte',
    savoir: 'S3.savoir',
    faire: 'S3.faire',
    maitriserDesc: 'S3.maitriserDesc',
    conditionKey: 'S3',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S4', week: 4, quarter: 1, module: 1,
    moduleTitle: 'modules.1',
    difficulty: 'decouverte',
    savoir: 'S4.savoir',
    faire: 'S4.faire',
    maitriserDesc: 'S4.maitriserDesc',
    conditionKey: 'S4',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
];

const MODULE_2: FinancialChallenge[] = [
  {
    id: 'S5', week: 5, quarter: 1, module: 2,
    moduleTitle: 'modules.2',
    difficulty: 'decouverte',
    savoir: 'S5.savoir',
    faire: 'S5.faire',
    maitriserDesc: 'S5.maitriserDesc',
    conditionKey: 'S5',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S6', week: 6, quarter: 1, module: 2,
    moduleTitle: 'modules.2',
    difficulty: 'decouverte',
    savoir: 'S6.savoir',
    faire: 'S6.faire',
    maitriserDesc: 'S6.maitriserDesc',
    conditionKey: 'manual',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S7', week: 7, quarter: 1, module: 2,
    moduleTitle: 'modules.2',
    difficulty: 'decouverte',
    savoir: 'S7.savoir',
    faire: 'S7.faire',
    maitriserDesc: 'S7.maitriserDesc',
    conditionKey: 'S7',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S8', week: 8, quarter: 1, module: 2,
    moduleTitle: 'modules.2',
    difficulty: 'decouverte',
    savoir: 'S8.savoir',
    faire: 'S8.faire',
    maitriserDesc: 'S8.maitriserDesc',
    conditionKey: 'S8',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
];

const MODULE_3: FinancialChallenge[] = [
  {
    id: 'S9', week: 9, quarter: 1, module: 3,
    moduleTitle: 'modules.3',
    difficulty: 'decouverte',
    savoir: 'S9.savoir',
    faire: 'S9.faire',
    maitriserDesc: 'S9.maitriserDesc',
    conditionKey: 'S9',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S10', week: 10, quarter: 1, module: 3,
    moduleTitle: 'modules.3',
    difficulty: 'decouverte',
    savoir: 'S10.savoir',
    faire: 'S10.faire',
    maitriserDesc: 'S10.maitriserDesc',
    conditionKey: 'S10',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S11', week: 11, quarter: 1, module: 3,
    moduleTitle: 'modules.3',
    difficulty: 'decouverte',
    savoir: 'S11.savoir',
    faire: 'S11.faire',
    maitriserDesc: 'S11.maitriserDesc',
    conditionKey: 'S11',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S12', week: 12, quarter: 1, module: 3,
    moduleTitle: 'modules.3',
    difficulty: 'decouverte',
    savoir: 'S12.savoir',
    faire: 'S12.faire',
    maitriserDesc: 'S12.maitriserDesc',
    conditionKey: 'S12',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
];

// --- T2: L'OPTIMISATION (S13-S24) ---

const MODULE_4: FinancialChallenge[] = [
  {
    id: 'S13', week: 13, quarter: 2, module: 4,
    moduleTitle: 'modules.4',
    difficulty: 'intermediaire',
    savoir: 'S13.savoir',
    faire: 'S13.faire',
    maitriserDesc: 'S13.maitriserDesc',
    conditionKey: 'S13',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S14', week: 14, quarter: 2, module: 4,
    moduleTitle: 'modules.4',
    difficulty: 'intermediaire',
    savoir: 'S14.savoir',
    faire: 'S14.faire',
    maitriserDesc: 'S14.maitriserDesc',
    conditionKey: 'S14',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S15', week: 15, quarter: 2, module: 4,
    moduleTitle: 'modules.4',
    difficulty: 'intermediaire',
    savoir: 'S15.savoir',
    faire: 'S15.faire',
    maitriserDesc: 'S15.maitriserDesc',
    conditionKey: 'S15',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S16', week: 16, quarter: 2, module: 4,
    moduleTitle: 'modules.4',
    difficulty: 'intermediaire',
    savoir: 'S16.savoir',
    faire: 'S16.faire',
    maitriserDesc: 'S16.maitriserDesc',
    conditionKey: 'S16',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
];

const MODULE_5: FinancialChallenge[] = [
  {
    id: 'S17', week: 17, quarter: 2, module: 5,
    moduleTitle: 'modules.5',
    difficulty: 'intermediaire',
    savoir: 'S17.savoir',
    faire: 'S17.faire',
    maitriserDesc: 'S17.maitriserDesc',
    conditionKey: 'manual',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S18', week: 18, quarter: 2, module: 5,
    moduleTitle: 'modules.5',
    difficulty: 'intermediaire',
    savoir: 'S18.savoir',
    faire: 'S18.faire',
    maitriserDesc: 'S18.maitriserDesc',
    conditionKey: 'S18',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S19', week: 19, quarter: 2, module: 5,
    moduleTitle: 'modules.5',
    difficulty: 'intermediaire',
    savoir: 'S19.savoir',
    faire: 'S19.faire',
    maitriserDesc: 'S19.maitriserDesc',
    conditionKey: 'S19',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S20', week: 20, quarter: 2, module: 5,
    moduleTitle: 'modules.5',
    difficulty: 'intermediaire',
    savoir: 'S20.savoir',
    faire: 'S20.faire',
    maitriserDesc: 'S20.maitriserDesc',
    conditionKey: 'S20',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
];

const MODULE_6: FinancialChallenge[] = [
  {
    id: 'S21', week: 21, quarter: 2, module: 6,
    moduleTitle: 'modules.6',
    difficulty: 'intermediaire',
    savoir: 'S21.savoir',
    faire: 'S21.faire',
    maitriserDesc: 'S21.maitriserDesc',
    conditionKey: 'S21',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S22', week: 22, quarter: 2, module: 6,
    moduleTitle: 'modules.6',
    difficulty: 'intermediaire',
    savoir: 'S22.savoir',
    faire: 'S22.faire',
    maitriserDesc: 'S22.maitriserDesc',
    conditionKey: 'S22',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S23', week: 23, quarter: 2, module: 6,
    moduleTitle: 'modules.6',
    difficulty: 'intermediaire',
    savoir: 'S23.savoir',
    faire: 'S23.faire',
    maitriserDesc: 'S23.maitriserDesc',
    conditionKey: 'S23',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S24', week: 24, quarter: 2, module: 6,
    moduleTitle: 'modules.6',
    difficulty: 'intermediaire',
    savoir: 'S24.savoir',
    faire: 'S24.faire',
    maitriserDesc: 'S24.maitriserDesc',
    conditionKey: 'S24',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
];

// --- T3: LA CROISSANCE (S25-S36) ---

const MODULE_7: FinancialChallenge[] = [
  {
    id: 'S25', week: 25, quarter: 3, module: 7,
    moduleTitle: 'modules.7',
    difficulty: 'avance',
    savoir: 'S25.savoir',
    faire: 'S25.faire',
    maitriserDesc: 'S25.maitriserDesc',
    conditionKey: 'S25',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S26', week: 26, quarter: 3, module: 7,
    moduleTitle: 'modules.7',
    difficulty: 'avance',
    savoir: 'S26.savoir',
    faire: 'S26.faire',
    maitriserDesc: 'S26.maitriserDesc',
    conditionKey: 'S26',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S27', week: 27, quarter: 3, module: 7,
    moduleTitle: 'modules.7',
    difficulty: 'avance',
    savoir: 'S27.savoir',
    faire: 'S27.faire',
    maitriserDesc: 'S27.maitriserDesc',
    conditionKey: 'S27',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S28', week: 28, quarter: 3, module: 7,
    moduleTitle: 'modules.7',
    difficulty: 'avance',
    savoir: 'S28.savoir',
    faire: 'S28.faire',
    maitriserDesc: 'S28.maitriserDesc',
    conditionKey: 'S28',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
];

const MODULE_8: FinancialChallenge[] = [
  {
    id: 'S29', week: 29, quarter: 3, module: 8,
    moduleTitle: 'modules.8',
    difficulty: 'avance',
    savoir: 'S29.savoir',
    faire: 'S29.faire',
    maitriserDesc: 'S29.maitriserDesc',
    conditionKey: 'S29',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S30', week: 30, quarter: 3, module: 8,
    moduleTitle: 'modules.8',
    difficulty: 'avance',
    savoir: 'S30.savoir',
    faire: 'S30.faire',
    maitriserDesc: 'S30.maitriserDesc',
    conditionKey: 'S30',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S31', week: 31, quarter: 3, module: 8,
    moduleTitle: 'modules.8',
    difficulty: 'avance',
    savoir: 'S31.savoir',
    faire: 'S31.faire',
    maitriserDesc: 'S31.maitriserDesc',
    conditionKey: 'S31',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S32', week: 32, quarter: 3, module: 8,
    moduleTitle: 'modules.8',
    difficulty: 'avance',
    savoir: 'S32.savoir',
    faire: 'S32.faire',
    maitriserDesc: 'S32.maitriserDesc',
    conditionKey: 'S32',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
];

const MODULE_9: FinancialChallenge[] = [
  {
    id: 'S33', week: 33, quarter: 3, module: 9,
    moduleTitle: 'modules.9',
    difficulty: 'avance',
    savoir: 'S33.savoir',
    faire: 'S33.faire',
    maitriserDesc: 'S33.maitriserDesc',
    conditionKey: 'S33',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S34', week: 34, quarter: 3, module: 9,
    moduleTitle: 'modules.9',
    difficulty: 'avance',
    savoir: 'S34.savoir',
    faire: 'S34.faire',
    maitriserDesc: 'S34.maitriserDesc',
    conditionKey: 'S34',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S35', week: 35, quarter: 3, module: 9,
    moduleTitle: 'modules.9',
    difficulty: 'avance',
    savoir: 'S35.savoir',
    faire: 'S35.faire',
    maitriserDesc: 'S35.maitriserDesc',
    conditionKey: 'S35',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S36', week: 36, quarter: 3, module: 9,
    moduleTitle: 'modules.9',
    difficulty: 'avance',
    savoir: 'S36.savoir',
    faire: 'S36.faire',
    maitriserDesc: 'S36.maitriserDesc',
    conditionKey: 'S36',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
];

// --- T4: LA MAITRISE (S37-S48) ---

const MODULE_10: FinancialChallenge[] = [
  {
    id: 'S37', week: 37, quarter: 4, module: 10,
    moduleTitle: 'modules.10',
    difficulty: 'expert',
    savoir: 'S37.savoir',
    faire: 'S37.faire',
    maitriserDesc: 'S37.maitriserDesc',
    conditionKey: 'S37',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S38', week: 38, quarter: 4, module: 10,
    moduleTitle: 'modules.10',
    difficulty: 'expert',
    savoir: 'S38.savoir',
    faire: 'S38.faire',
    maitriserDesc: 'S38.maitriserDesc',
    conditionKey: 'S38',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S39', week: 39, quarter: 4, module: 10,
    moduleTitle: 'modules.10',
    difficulty: 'expert',
    savoir: 'S39.savoir',
    faire: 'S39.faire',
    maitriserDesc: 'S39.maitriserDesc',
    conditionKey: 'S39',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S40', week: 40, quarter: 4, module: 10,
    moduleTitle: 'modules.10',
    difficulty: 'expert',
    savoir: 'S40.savoir',
    faire: 'S40.faire',
    maitriserDesc: 'S40.maitriserDesc',
    conditionKey: 'S40',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
];

const MODULE_11: FinancialChallenge[] = [
  {
    id: 'S41', week: 41, quarter: 4, module: 11,
    moduleTitle: 'modules.11',
    difficulty: 'expert',
    savoir: 'S41.savoir',
    faire: 'S41.faire',
    maitriserDesc: 'S41.maitriserDesc',
    conditionKey: 'S41',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S42', week: 42, quarter: 4, module: 11,
    moduleTitle: 'modules.11',
    difficulty: 'expert',
    savoir: 'S42.savoir',
    faire: 'S42.faire',
    maitriserDesc: 'S42.maitriserDesc',
    conditionKey: 'S42',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S43', week: 43, quarter: 4, module: 11,
    moduleTitle: 'modules.11',
    difficulty: 'expert',
    savoir: 'S43.savoir',
    faire: 'S43.faire',
    maitriserDesc: 'S43.maitriserDesc',
    conditionKey: 'S43',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S44', week: 44, quarter: 4, module: 11,
    moduleTitle: 'modules.11',
    difficulty: 'expert',
    savoir: 'S44.savoir',
    faire: 'S44.faire',
    maitriserDesc: 'S44.maitriserDesc',
    conditionKey: 'S44',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
];

const MODULE_12: FinancialChallenge[] = [
  {
    id: 'S45', week: 45, quarter: 4, module: 12,
    moduleTitle: 'modules.12',
    difficulty: 'expert',
    savoir: 'S45.savoir',
    faire: 'S45.faire',
    maitriserDesc: 'S45.maitriserDesc',
    conditionKey: 'S45',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S46', week: 46, quarter: 4, module: 12,
    moduleTitle: 'modules.12',
    difficulty: 'expert',
    savoir: 'S46.savoir',
    faire: 'S46.faire',
    maitriserDesc: 'S46.maitriserDesc',
    conditionKey: 'S46',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S47', week: 47, quarter: 4, module: 12,
    moduleTitle: 'modules.12',
    difficulty: 'expert',
    savoir: 'S47.savoir',
    faire: 'S47.faire',
    maitriserDesc: 'S47.maitriserDesc',
    conditionKey: 'S47',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S48', week: 48, quarter: 4, module: 12,
    moduleTitle: 'modules.12',
    difficulty: 'expert',
    savoir: 'S48.savoir',
    faire: 'S48.faire',
    maitriserDesc: 'S48.maitriserDesc',
    conditionKey: 'S48',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
];

// --- Export ---

export const FINANCIAL_CHALLENGES: FinancialChallenge[] = [
  ...MODULE_1,
  ...MODULE_2,
  ...MODULE_3,
  ...MODULE_4,
  ...MODULE_5,
  ...MODULE_6,
  ...MODULE_7,
  ...MODULE_8,
  ...MODULE_9,
  ...MODULE_10,
  ...MODULE_11,
  ...MODULE_12,
];

export const CHALLENGES_BY_ID: Record<string, FinancialChallenge> = {};
for (const c of FINANCIAL_CHALLENGES) {
  CHALLENGES_BY_ID[c.id] = c;
}

/** i18n keys — use t(`challenges:${MODULE_TITLES[moduleNumber]}`) */
export const MODULE_TITLES: Record<number, string> = {
  1: 'modules.1',
  2: 'modules.2',
  3: 'modules.3',
  4: 'modules.4',
  5: 'modules.5',
  6: 'modules.6',
  7: 'modules.7',
  8: 'modules.8',
  9: 'modules.9',
  10: 'modules.10',
  11: 'modules.11',
  12: 'modules.12',
};

/** i18n keys — use t(`challenges:${DIFFICULTY_LABELS[difficulty]}`) */
export const DIFFICULTY_LABELS: Record<string, string> = {
  decouverte: 'difficulty.decouverte',
  intermediaire: 'difficulty.intermediaire',
  avance: 'difficulty.avance',
  expert: 'difficulty.expert',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  decouverte: '#4ADE80',
  intermediaire: '#60A5FA',
  avance: '#A78BFA',
  expert: '#FBBF24',
};
