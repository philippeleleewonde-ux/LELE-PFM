// ============================================================================
// MODULE 2 — ENQUÊTE SATISFACTION EMPLOYÉS
// Data: 33 questions réparties en 5 sections (Démographie + 4 Thèmes)
// Source: JotForm M2 "The Satisfaction of Employees" V2024
// ============================================================================

// --- Types -------------------------------------------------------------------

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

export const SURVEY_SECTIONS: SurveySection[] = [
  { id: 'demographics', number: 0, title: 'Vos Informations', subtitle: '3 questions pour mieux vous connaître', questionCount: 3 },
  { id: 'theme1', number: 1, title: 'Votre Entreprise', subtitle: "Image et gestion de votre entreprise", questionCount: 8 },
  { id: 'theme2', number: 2, title: 'Votre Travail', subtitle: "Conditions et organisation de votre travail", questionCount: 10 },
  { id: 'theme3', number: 3, title: 'Vos Relations', subtitle: "Relations avec hiérarchie et collègues", questionCount: 7 },
  { id: 'theme4', number: 4, title: 'Votre Avenir', subtitle: "Évolution et développement professionnel", questionCount: 5 },
];

// --- Shared Likert Scale -----------------------------------------------------

const LIKERT_OPTIONS: SurveyOption[] = [
  { text: 'Satisfait Pleinement', value: 1, type: 'secondary' },
  { text: 'Satisfait', value: 2, type: 'secondary' },
  { text: 'Satisfait Moyennement', value: 3, type: 'secondary' },
  { text: 'Satisfait Insuffisamment', value: 4, type: 'secondary' },
  { text: 'Pas satisfait du tout', value: 5, type: 'secondary' },
];

// --- Theme shorthands (DRY) --------------------------------------------------

const demo = { themeId: 'demographics', themeNumber: 0, themeTitle: 'Vos Informations', themeSubtitle: '3 questions pour mieux vous connaître' };
const t1   = { themeId: 'theme1', themeNumber: 1, themeTitle: 'Votre Entreprise', themeSubtitle: "Image et gestion de votre entreprise" };
const t2   = { themeId: 'theme2', themeNumber: 2, themeTitle: 'Votre Travail', themeSubtitle: "Conditions et organisation de votre travail" };
const t3   = { themeId: 'theme3', themeNumber: 3, themeTitle: 'Vos Relations', themeSubtitle: "Relations avec hiérarchie et collègues" };
const t4   = { themeId: 'theme4', themeNumber: 4, themeTitle: 'Votre Avenir', themeSubtitle: "Évolution et développement professionnel" };

// --- 33 Questions ------------------------------------------------------------

export const SURVEY_QUESTIONS: SurveyQuestion[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // DEMOGRAPHICS (Q1–Q3)
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
  // THÈME 1 — VOTRE ENTREPRISE (Q4–Q11, 8 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 4,  code: 'T1Q1', ...t1, isReversed: false, question: "Je trouve agréable de travailler dans mon entreprise", options: LIKERT_OPTIONS },
  { id: 5,  code: 'T1Q2', ...t1, isReversed: false, question: "Je suis bien informé(e) de ses projets et de ses objectifs", options: LIKERT_OPTIONS },
  { id: 6,  code: 'T1Q3', ...t1, isReversed: false, question: "Je considère que la direction prend de bonnes décisions", options: LIKERT_OPTIONS },
  { id: 7,  code: 'T1Q4', ...t1, isReversed: false, question: "Les représentants du personnel ont un rôle actif", options: LIKERT_OPTIONS },
  { id: 8,  code: 'T1Q5', ...t1, isReversed: false, question: "Je pense que mon entreprise va bien", options: LIKERT_OPTIONS },
  { id: 9,  code: 'T1Q6', ...t1, isReversed: false, question: "Mon entreprise est capable d'assurer l'avenir de ses employés", options: LIKERT_OPTIONS },
  { id: 10, code: 'T1Q7', ...t1, isReversed: false, question: "Le système de primes et d'intéressement est incitatif", options: LIKERT_OPTIONS },
  { id: 11, code: 'T1Q8', ...t1, isReversed: false, question: "Mon entreprise prend en compte mes problèmes personnels", options: LIKERT_OPTIONS },

  // ═══════════════════════════════════════════════════════════════════════════
  // THÈME 2 — VOTRE TRAVAIL (Q12–Q21, 10 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 12, code: 'T2Q9',  ...t2, isReversed: false, question: "Mon travail est normalement rémunéré", options: LIKERT_OPTIONS },
  { id: 13, code: 'T2Q10', ...t2, isReversed: false, question: "Je sais clairement ce que j'ai à faire", options: LIKERT_OPTIONS },
  { id: 14, code: 'T2Q11', ...t2, isReversed: false, question: "J'arrive à assurer ma charge de travail", options: LIKERT_OPTIONS },
  { id: 15, code: 'T2Q12', ...t2, isReversed: false, question: "L'organisation de mon temps de travail a évolué positivement", options: LIKERT_OPTIONS },
  { id: 16, code: 'T2Q13', ...t2, isReversed: false, question: "Mon métier est gérable (contraintes de temps et urgences)", options: LIKERT_OPTIONS },
  { id: 17, code: 'T2Q14', ...t2, isReversed: false, question: "Mon emploi est en rapport avec ma formation et mes compétences", options: LIKERT_OPTIONS },
  { id: 18, code: 'T2Q15', ...t2, isReversed: false, question: "Un peu plus de polyvalence dans mon travail serait bénéfique", options: LIKERT_OPTIONS },
  { id: 19, code: 'T2Q16', ...t2, isReversed: false, question: "Mon entreprise me donne les moyens matériels nécessaires", options: LIKERT_OPTIONS },
  { id: 20, code: 'T2Q17', ...t2, isReversed: false, question: "Les conditions d'hygiène et de sécurité sont satisfaisantes", options: LIKERT_OPTIONS },
  { id: 21, code: 'T2Q18', ...t2, isReversed: false, question: "Mon travail contribue à satisfaire les clients", options: LIKERT_OPTIONS },

  // ═══════════════════════════════════════════════════════════════════════════
  // THÈME 3 — VOS RELATIONS (Q22–Q28, 7 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 22, code: 'T3Q19', ...t3, isReversed: false, question: "Je peux facilement discuter avec mon superviseur", options: LIKERT_OPTIONS },
  { id: 23, code: 'T3Q20', ...t3, isReversed: false, question: "Je reçois des instructions claires et efficaces", options: LIKERT_OPTIONS },
  { id: 24, code: 'T3Q21', ...t3, isReversed: false, question: "Mes superviseurs prennent mon avis en compte", options: LIKERT_OPTIONS },
  { id: 25, code: 'T3Q22', ...t3, isReversed: false, question: "Je peux facilement avoir un contact avec la direction", options: LIKERT_OPTIONS },
  { id: 26, code: 'T3Q23', ...t3, isReversed: false, question: "Les relations sont agréables avec la plupart de mes collègues", options: LIKERT_OPTIONS },
  { id: 27, code: 'T3Q24', ...t3, isReversed: false, question: "Je ne subis pas de pressions excessives et répétées", options: LIKERT_OPTIONS },
  { id: 28, code: 'T3Q25', ...t3, isReversed: false, question: "Les représentants du personnel sont à l'écoute de mes besoins", options: LIKERT_OPTIONS },

  // ═══════════════════════════════════════════════════════════════════════════
  // THÈME 4 — VOTRE AVENIR (Q29–Q33, 5 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 29, code: 'T4Q26', ...t4, isReversed: false, question: "Je peux accroître mes compétences et mes connaissances", options: LIKERT_OPTIONS },
  { id: 30, code: 'T4Q27', ...t4, isReversed: false, question: "La polyvalence me permet de progresser", options: LIKERT_OPTIONS },
  { id: 31, code: 'T4Q28', ...t4, isReversed: false, question: "Mon service reconnaît la qualité de mon travail", options: LIKERT_OPTIONS },
  { id: 32, code: 'T4Q29', ...t4, isReversed: false, question: "Mon entreprise peut m'offrir un développement de carrière", options: LIKERT_OPTIONS },
  { id: 33, code: 'T4Q30', ...t4, isReversed: false, question: "Je souhaite évoluer et prendre de nouvelles responsabilités", options: LIKERT_OPTIONS },
];

export const TOTAL_QUESTIONS = SURVEY_QUESTIONS.length; // 33
