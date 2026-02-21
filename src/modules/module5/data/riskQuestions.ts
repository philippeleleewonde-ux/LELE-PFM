// ============================================================================
// MODULE 5 — ENQUÊTE RISQUES PSYCHOSOCIAUX
// Data: 21 questions (3 démo + 18 Likert) réparties en 7 sections (Démographie + 6 Axes)
// Source: JotForm M5 "Software M5. Psychosocial Risks V.2021"
// ============================================================================

// --- Types (reuse M2 types for compatibility) --------------------------------

export type SurveyOptionType = 'primary' | 'secondary';

export interface SurveyOption {
  text: string;
  value: number | string;
  type: SurveyOptionType;
}

export interface SurveyQuestion {
  id: number;
  code: string;
  question: string;
  themeId: string;
  themeNumber: number;
  themeTitle: string;
  themeSubtitle: string;
  isReversed: boolean;
  options: SurveyOption[];
}

export interface SurveySection {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  questionCount: number;
}

// --- Sections ----------------------------------------------------------------

export const RPS_SECTIONS: SurveySection[] = [
  { id: 'demographics', number: 0, title: 'Vos Informations', subtitle: '3 questions pour mieux vous connaître', questionCount: 3 },
  { id: 'axis1', number: 1, title: 'Exigences du travail', subtitle: 'Charge, pression et complexité du travail', questionCount: 4 },
  { id: 'axis2', number: 2, title: 'Exigences émotionnelles', subtitle: 'Fatigue émotionnelle et prise en compte des sentiments', questionCount: 2 },
  { id: 'axis3', number: 3, title: 'Autonomie / Marges de manoeuvre', subtitle: 'Planification, compétences et participation', questionCount: 4 },
  { id: 'axis4', number: 4, title: 'Rapports sociaux', subtitle: 'Relations, soutien et reconnaissance au travail', questionCount: 5 },
  { id: 'axis5', number: 5, title: 'Conflits de valeurs', subtitle: 'Dimension éthique et morale du travail', questionCount: 1 },
  { id: 'axis6', number: 6, title: 'Insécurité emploi / salaire', subtitle: 'Durabilité de l\'emploi et soutenabilité des efforts', questionCount: 2 },
];

// --- Shared Likert Scale (identical to M2) -----------------------------------

const LIKERT_OPTIONS: SurveyOption[] = [
  { text: 'Satisfait Pleinement', value: 1, type: 'secondary' },
  { text: 'Satisfait', value: 2, type: 'secondary' },
  { text: 'Satisfait Moyennement', value: 3, type: 'secondary' },
  { text: 'Satisfait Insuffisamment', value: 4, type: 'secondary' },
  { text: 'Pas satisfait du tout', value: 5, type: 'secondary' },
];

// --- Axis shorthands (DRY) ---------------------------------------------------

const demo = { themeId: 'demographics', themeNumber: 0, themeTitle: 'Vos Informations', themeSubtitle: '3 questions pour mieux vous connaître' };
const a1   = { themeId: 'axis1', themeNumber: 1, themeTitle: 'Exigences du travail', themeSubtitle: 'Charge, pression et complexité du travail' };
const a2   = { themeId: 'axis2', themeNumber: 2, themeTitle: 'Exigences émotionnelles', themeSubtitle: 'Fatigue émotionnelle et prise en compte des sentiments' };
const a3   = { themeId: 'axis3', themeNumber: 3, themeTitle: 'Autonomie / Marges de manoeuvre', themeSubtitle: 'Planification, compétences et participation' };
const a4   = { themeId: 'axis4', themeNumber: 4, themeTitle: 'Rapports sociaux', themeSubtitle: 'Relations, soutien et reconnaissance au travail' };
const a5   = { themeId: 'axis5', themeNumber: 5, themeTitle: 'Conflits de valeurs', themeSubtitle: 'Dimension éthique et morale du travail' };
const a6   = { themeId: 'axis6', themeNumber: 6, themeTitle: 'Insécurité emploi / salaire', themeSubtitle: "Durabilité de l'emploi et soutenabilité des efforts" };

// --- 21 Questions ------------------------------------------------------------

export const RPS_QUESTIONS: SurveyQuestion[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // DEMOGRAPHICS (D1–D3)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 1, code: 'D1', ...demo, isReversed: false,
    question: "Sélectionnez votre ligne d'activité",
    options: [
      { text: 'Direction Générale', value: 'direction', type: 'secondary' },
      { text: 'Ressources Humaines', value: 'rh', type: 'secondary' },
      { text: 'Finance & Comptabilité', value: 'finance', type: 'secondary' },
      { text: 'Commercial & Marketing', value: 'commercial', type: 'secondary' },
      { text: 'Production & Opérations', value: 'production', type: 'secondary' },
      { text: 'Informatique & Technologie', value: 'it', type: 'secondary' },
      { text: 'Logistique & Supply Chain', value: 'logistique', type: 'secondary' },
      { text: 'Support & Administration', value: 'support', type: 'secondary' },
    ],
  },
  {
    id: 2, code: 'D2', ...demo, isReversed: false,
    question: "Sélectionnez votre catégorie professionnelle",
    options: [
      { text: 'Cadre', value: 'executive', type: 'secondary' },
      { text: 'Agent de maîtrise', value: 'supervisor', type: 'secondary' },
      { text: 'Employé', value: 'clerk', type: 'secondary' },
      { text: 'Ouvrier', value: 'worker', type: 'secondary' },
    ],
  },
  {
    id: 3, code: 'D3', ...demo, isReversed: false,
    question: "Sélectionnez votre genre",
    options: [
      { text: 'Homme', value: 'man', type: 'secondary' },
      { text: 'Femme', value: 'woman', type: 'secondary' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AXE 1 — EXIGENCES DU TRAVAIL (Q4–Q7, 4 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 4, code: 'A1Q1', ...a1, isReversed: false, question: "Votre ressenti par rapport à la charge de travail ?", options: LIKERT_OPTIONS },
  { id: 5, code: 'A1Q2', ...a1, isReversed: false, question: "Votre ressenti par rapport à la pression temporelle ?", options: LIKERT_OPTIONS },
  { id: 6, code: 'A1Q3', ...a1, isReversed: false, question: "Votre ressenti par rapport à la complexité du travail ?", options: LIKERT_OPTIONS },
  { id: 7, code: 'A1Q4', ...a1, isReversed: false, question: "Les difficultés de conciliation entre temps de travail et hors travail ?", options: LIKERT_OPTIONS },

  // ═══════════════════════════════════════════════════════════════════════════
  // AXE 2 — EXIGENCES ÉMOTIONNELLES (Q8–Q9, 2 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 8,  code: 'A2Q5', ...a2, isReversed: false, question: "Votre état de fatigue ou d'épuisement au travail ?", options: LIKERT_OPTIONS },
  { id: 9,  code: 'A2Q6', ...a2, isReversed: false, question: "Votre ressenti par rapport à la prise en compte de vos sentiments relationnels au travail ?", options: LIKERT_OPTIONS },

  // ═══════════════════════════════════════════════════════════════════════════
  // AXE 3 — AUTONOMIE / MARGES DE MANOEUVRE (Q10–Q13, 4 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 10, code: 'A3Q7',  ...a3, isReversed: false, question: "Votre ressenti par rapport à la planification du travail ?", options: LIKERT_OPTIONS },
  { id: 11, code: 'A3Q8',  ...a3, isReversed: false, question: "Votre ressenti par rapport à l'utilisation et au développement de vos compétences ?", options: LIKERT_OPTIONS },
  { id: 12, code: 'A3Q9',  ...a3, isReversed: false, question: "Votre ressenti par rapport à la participation et la représentation des salariés ?", options: LIKERT_OPTIONS },
  { id: 13, code: 'A3Q10', ...a3, isReversed: false, question: "Votre ressenti par rapport à l'autonomie qui vous est laissée dans votre travail ?", options: LIKERT_OPTIONS },

  // ═══════════════════════════════════════════════════════════════════════════
  // AXE 4 — RAPPORTS SOCIAUX / RELATIONS AU TRAVAIL (Q14–Q18, 5 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 14, code: 'A4Q11', ...a4, isReversed: false, question: "Votre ressenti par rapport à l'aide de vos collègues au travail ?", options: LIKERT_OPTIONS },
  { id: 15, code: 'A4Q12', ...a4, isReversed: false, question: "Votre ressenti par rapport aux comportements hostiles ?", options: LIKERT_OPTIONS },
  { id: 16, code: 'A4Q13', ...a4, isReversed: false, question: "Votre ressenti par rapport à la reconnaissance de vos efforts de progrès ?", options: LIKERT_OPTIONS },
  { id: 17, code: 'A4Q14', ...a4, isReversed: false, question: "Votre ressenti par rapport à l'efficacité dans le travail ?", options: LIKERT_OPTIONS },
  { id: 18, code: 'A4Q15', ...a4, isReversed: false, question: "Votre ressenti par rapport aux responsables hiérarchiques ?", options: LIKERT_OPTIONS },

  // ═══════════════════════════════════════════════════════════════════════════
  // AXE 5 — CONFLITS DE VALEURS (Q19, 1 question)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 19, code: 'A5Q16', ...a5, isReversed: false, question: "Votre ressenti par rapport à la dimension morale ou l'éthique du travail ?", options: LIKERT_OPTIONS },

  // ═══════════════════════════════════════════════════════════════════════════
  // AXE 6 — INSÉCURITÉ EMPLOI / SALAIRE (Q20–Q21, 2 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 20, code: 'A6Q17', ...a6, isReversed: false, question: "Votre ressenti par rapport à la durabilité de votre emploi et l'évolution des revenus ?", options: LIKERT_OPTIONS },
  { id: 21, code: 'A6Q18', ...a6, isReversed: false, question: "Votre ressenti par rapport aux efforts à investir de manière continue pour progresser ?", options: LIKERT_OPTIONS },
];

export const TOTAL_QUESTIONS = RPS_QUESTIONS.length; // 21
