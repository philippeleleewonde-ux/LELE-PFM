// ============================================================================
// MODULE 2 — SCORING ENGINE CONSTANTS
// Source: 9-M2-Centredecalcul-MMS.xls
// ============================================================================

import type { AlertLabel, AlertLevel, ParticipationLabel } from './types';

// --- DC Names ---------------------------------------------------------------

export const DC_NAMES: Record<string, string> = {
  DC1: 'Conditions de travail',
  DC2: 'Organisation du travail',
  DC3: 'Communication',
  DC4: 'Gestion du temps',
  DC5: 'Formation intégrée',
  DC6: 'Mise en oeuvre stratégique',
};

// --- Question → DC mapping (30 questions → 6 domaines) ---------------------

export const QUESTION_TO_DC: Record<string, string> = {
  // DC1 - Conditions de travail (3 questions)
  'T1Q1': 'DC1',
  'T2Q16': 'DC1',
  'T2Q17': 'DC1',
  // DC2 - Organisation du travail (3 questions)
  'T2Q10': 'DC2',
  'T2Q11': 'DC2',
  'T2Q14': 'DC2',
  // DC3 - Communication (10 questions)
  'T1Q2': 'DC3',
  'T1Q4': 'DC3',
  'T1Q8': 'DC3',
  'T2Q18': 'DC3',
  'T3Q19': 'DC3',
  'T3Q20': 'DC3',
  'T3Q21': 'DC3',
  'T3Q22': 'DC3',
  'T3Q23': 'DC3',
  'T3Q25': 'DC3',
  // DC4 - Gestion du temps (3 questions)
  'T2Q13': 'DC4',
  'T2Q12': 'DC4',
  'T3Q24': 'DC4',
  // DC5 - Formation intégrée (3 questions)
  'T4Q26': 'DC5',
  'T2Q15': 'DC5',
  'T4Q27': 'DC5',
  // DC6 - Mise en oeuvre stratégique (8 questions)
  'T1Q3': 'DC6',
  'T1Q5': 'DC6',
  'T1Q6': 'DC6',
  'T1Q7': 'DC6',
  'T2Q9': 'DC6',
  'T4Q28': 'DC6',
  'T4Q29': 'DC6',
  'T4Q30': 'DC6',
};

// --- Question → Action label (recommendations) ----------------------------

export const QUESTION_ACTION_LABELS: Record<string, string> = {
  'T1Q1': "Améliorer l'ambiance globale de l'entreprise",
  'T1Q2': "Être mieux informé des projets et objectifs de l'entreprise",
  'T1Q3': "L'entreprise doit prendre de bonnes orientations",
  'T1Q4': "Améliorer le rôle des représentants de salariés",
  'T1Q5': "Améliorer la santé financière de l'entreprise",
  'T1Q6': "Améliorer les perspectives d'avenir",
  'T1Q7': "Améliorer le système de primes et d'intéressement",
  'T1Q8': "Améliorer l'écoute des problèmes personnels",
  'T2Q9': "Améliorer les salaires",
  'T2Q10': "Montrer clairement ce que l'on doit faire",
  'T2Q11': "Aider les salariés à assurer la charge de travail",
  'T2Q12': "Améliorer l'organisation du temps de travail",
  'T2Q13': "Améliorer le métier (contraintes de temps, urgences)",
  'T2Q14': "Donner au salarié un emploi en rapport avec sa formation",
  'T2Q15': "Développer la polyvalence",
  'T2Q16': "Donner les moyens matériels nécessaires",
  'T2Q17': "Améliorer les conditions d'hygiène et de sécurité",
  'T2Q18': "Mieux satisfaire les clients",
  'T3Q19': "Faciliter le contact avec le supérieur hiérarchique",
  'T3Q20': "Recevoir des instructions claires et efficaces",
  'T3Q21': "Prendre en compte l'avis des salariés",
  'T3Q22': "Faciliter le contact avec la direction",
  'T3Q23': "Améliorer les rapports entre les salariés",
  'T3Q24': "Éviter de mettre des pressions excessives et répétées",
  'T3Q25': "Les élus du personnel doivent mieux écouter les salariés",
  'T4Q26': "Développer mieux les compétences",
  'T4Q27': "Équilibrer le développement de la polyvalence",
  'T4Q28': "Reconnaître la qualité de travail des salariés",
  'T4Q29': "Offrir une évolution de carrière",
  'T4Q30': "Équilibrer l'évolution des responsabilités",
};

// --- Theme names -----------------------------------------------------------

export const THEME_NAMES: Record<string, string> = {
  theme1: 'Votre Entreprise',
  theme2: 'Votre Travail',
  theme3: 'Vos Relations',
  theme4: 'Votre Avenir',
};

// --- Question → Theme mapping (derived from question codes) ----------------

export const QUESTION_THEMES: Record<string, string> = {
  'T1Q1': 'theme1', 'T1Q2': 'theme1', 'T1Q3': 'theme1', 'T1Q4': 'theme1',
  'T1Q5': 'theme1', 'T1Q6': 'theme1', 'T1Q7': 'theme1', 'T1Q8': 'theme1',
  'T2Q9': 'theme2', 'T2Q10': 'theme2', 'T2Q11': 'theme2', 'T2Q12': 'theme2',
  'T2Q13': 'theme2', 'T2Q14': 'theme2', 'T2Q15': 'theme2', 'T2Q16': 'theme2',
  'T2Q17': 'theme2', 'T2Q18': 'theme2',
  'T3Q19': 'theme3', 'T3Q20': 'theme3', 'T3Q21': 'theme3', 'T3Q22': 'theme3',
  'T3Q23': 'theme3', 'T3Q24': 'theme3', 'T3Q25': 'theme3',
  'T4Q26': 'theme4', 'T4Q27': 'theme4', 'T4Q28': 'theme4', 'T4Q29': 'theme4',
  'T4Q30': 'theme4',
};

// --- Alert thresholds ------------------------------------------------------

export function scoreToAlertLevel(avgScore: number): AlertLevel {
  if (avgScore <= 2) return 1;
  if (avgScore <= 3) return 2;
  return 3;
}

export function scoreToAlertLabel(avgScore: number): AlertLabel {
  if (avgScore <= 1.5) return 'Satisfait Pleinement';
  if (avgScore <= 2.5) return 'Satisfait';
  if (avgScore <= 3.5) return 'Satisfait moyennement';
  if (avgScore <= 4.5) return 'Satisfait insuffisamment';
  return 'Pas satisfait du tout';
}

export function participationToAlert(rate: number): { level: AlertLevel; label: ParticipationLabel } {
  if (rate >= 50) return { level: 1, label: 'Excellente' };
  if (rate >= 30) return { level: 1, label: 'Importante' };
  if (rate >= 20) return { level: 2, label: 'Moyenne' };
  if (rate >= 10) return { level: 3, label: 'Faible' };
  return { level: 3, label: 'Trop faible' };
}

// --- M1 DC importance labels -----------------------------------------------

export function m1ScoreToLabel(score: number): string {
  if (score >= 4) return 'Très important';
  if (score >= 3) return 'Important';
  if (score >= 2) return 'Modéré';
  return 'Faible';
}
