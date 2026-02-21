// ============================================================================
// MODULE 5 — RPS SCORING ENGINE CONSTANTS
// Source: M5-Psychosocial_risks_V_2021.html
// ============================================================================

import type { AlertLabel, AlertLevel, ParticipationLabel } from './types';

// --- DR Names (Domaines de Risque) ------------------------------------------

export const DR_NAMES: Record<string, string> = {
  DR1: 'Exigences du travail',
  DR2: 'Exigences émotionnelles',
  DR3: 'Autonomie / Marges de manoeuvre',
  DR4: 'Rapports sociaux',
  DR5: 'Conflits de valeurs',
  DR6: 'Insécurité emploi / salaire',
};

// --- Question → DR mapping (18 questions → 6 domaines de risque) -----------

export const QUESTION_TO_DR: Record<string, string> = {
  // DR1 - Exigences du travail (4 questions)
  'A1Q1': 'DR1',
  'A1Q2': 'DR1',
  'A1Q3': 'DR1',
  'A1Q4': 'DR1',
  // DR2 - Exigences émotionnelles (2 questions)
  'A2Q5': 'DR2',
  'A2Q6': 'DR2',
  // DR3 - Autonomie / Marges de manoeuvre (4 questions)
  'A3Q7': 'DR3',
  'A3Q8': 'DR3',
  'A3Q9': 'DR3',
  'A3Q10': 'DR3',
  // DR4 - Rapports sociaux (5 questions)
  'A4Q11': 'DR4',
  'A4Q12': 'DR4',
  'A4Q13': 'DR4',
  'A4Q14': 'DR4',
  'A4Q15': 'DR4',
  // DR5 - Conflits de valeurs (1 question)
  'A5Q16': 'DR5',
  // DR6 - Insécurité emploi / salaire (2 questions)
  'A6Q17': 'DR6',
  'A6Q18': 'DR6',
};

// --- Question → Action label (recommendations) ----------------------------

export const QUESTION_ACTION_LABELS: Record<string, string> = {
  'A1Q1': 'Réduire la surcharge de travail',
  'A1Q2': 'Réduire la pression temporelle et les urgences',
  'A1Q3': 'Simplifier les tâches complexes et fournir un soutien technique',
  'A1Q4': 'Améliorer la conciliation vie professionnelle / vie personnelle',
  'A2Q5': "Prévenir l'épuisement professionnel (burn out)",
  'A2Q6': 'Prendre en compte les exigences émotionnelles du travail',
  'A3Q7': 'Améliorer la prévisibilité et la planification du travail',
  'A3Q8': 'Développer l\'utilisation et la montée en compétences',
  'A3Q9': 'Renforcer la participation des salariés aux changements',
  'A3Q10': 'Accroître l\'autonomie dans les procédures de travail',
  'A4Q11': 'Renforcer le soutien social entre collègues',
  'A4Q12': 'Lutter contre les comportements hostiles et la violence',
  'A4Q13': 'Améliorer la reconnaissance et la gratitude des efforts',
  'A4Q14': "Améliorer l'efficacité collective au travail",
  'A4Q15': 'Renforcer la clarté du leadership et le pilotage du changement',
  'A5Q16': 'Réduire les conflits éthiques et les situations de souffrance morale',
  'A6Q17': "Sécuriser l'emploi et l'évolution des revenus",
  'A6Q18': 'Rendre les efforts de travail soutenables dans la durée',
};

// --- Axis names (6 axes psychosociaux) -------------------------------------

export const AXIS_NAMES: Record<string, string> = {
  axis1: 'Exigences du travail',
  axis2: 'Exigences émotionnelles',
  axis3: 'Autonomie / Marges de manoeuvre',
  axis4: 'Rapports sociaux',
  axis5: 'Conflits de valeurs',
  axis6: 'Insécurité emploi / salaire',
};

// --- Question → Axis mapping -----------------------------------------------

export const QUESTION_AXES: Record<string, string> = {
  'A1Q1': 'axis1', 'A1Q2': 'axis1', 'A1Q3': 'axis1', 'A1Q4': 'axis1',
  'A2Q5': 'axis2', 'A2Q6': 'axis2',
  'A3Q7': 'axis3', 'A3Q8': 'axis3', 'A3Q9': 'axis3', 'A3Q10': 'axis3',
  'A4Q11': 'axis4', 'A4Q12': 'axis4', 'A4Q13': 'axis4', 'A4Q14': 'axis4', 'A4Q15': 'axis4',
  'A5Q16': 'axis5',
  'A6Q17': 'axis6', 'A6Q18': 'axis6',
};

// --- Alert thresholds (identical to M2) ------------------------------------

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
