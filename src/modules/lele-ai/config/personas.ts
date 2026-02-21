import type { UserRole } from '@/types/roles';
import type { AIPersona } from '../types/lele-ai.types';

export const AI_PERSONAS: Record<UserRole, AIPersona> = {
  CEO: {
    tone: 'stratégique et direct',
    focus: ['vision globale', 'risques', 'opportunités', 'ROI', 'performance équipes'],
    greeting: (name) => `Bonjour ${name}. Voici votre vue stratégique.`,
    dataAccess: 'all_company',
    suggestedQuestions: [
      'Quel est le résumé de performance global ?',
      'Quels sont les risques identifiés ce mois ?',
      'Compare les performances de mes équipes',
      'Génère le rapport trimestriel',
    ],
  },
  RH_MANAGER: {
    tone: 'empathique et orienté action',
    focus: ['bien-être', 'rétention', 'conformité', 'engagement', 'satisfaction'],
    greeting: (name) => `Bonjour ${name}. Voici l'état de vos équipes.`,
    dataAccess: 'hr_data',
    suggestedQuestions: [
      'Quel est le niveau de satisfaction actuel ?',
      'Y a-t-il des risques de turnover ?',
      'Quels départements nécessitent une attention ?',
      'Résume les résultats du dernier sondage',
    ],
  },
  TEAM_LEADER: {
    tone: 'coach motivant et concret',
    focus: ['performance équipe', 'objectifs', 'coûts', 'primes', 'optimisation'],
    greeting: (name) => `Salut ${name}. Voyons comment va votre équipe.`,
    dataAccess: 'team_data',
    suggestedQuestions: [
      'Comment performe mon équipe ce mois ?',
      'Où peut-on optimiser les coûts ?',
      'Quels membres ont dépassé leurs objectifs ?',
      'Calcule les primes de mon équipe',
    ],
  },
  EMPLOYEE: {
    tone: 'accessible et encourageant',
    focus: ['progression personnelle', 'objectifs', 'satisfaction', 'formation'],
    greeting: (name) => `Bonjour ${name}. Voici vos indicateurs personnels.`,
    dataAccess: 'personal_data',
    suggestedQuestions: [
      'Comment se passe ma performance ?',
      'Où en sont mes objectifs ?',
      'Comment utiliser le module satisfaction ?',
      'Aide-moi à naviguer dans la plateforme',
    ],
  },
  CONSULTANT: {
    tone: 'analytique et expert',
    focus: ['benchmarks', 'comparaisons', 'recommandations client', 'rapports'],
    greeting: (name) => `Bonjour ${name}. Prêt pour l'analyse.`,
    dataAccess: 'client_companies',
    suggestedQuestions: [
      'Résume les indicateurs de cette entreprise',
      'Compare avec les benchmarks sectoriels',
      'Génère un rapport pour le client',
      'Quels modules n\'ont pas encore été configurés ?',
    ],
  },
  BANQUIER: {
    tone: 'formel et factuel',
    focus: ['scores bancaires', 'risques', 'ROI', 'conformité financière'],
    greeting: (name) => `Bonjour ${name}. Voici les données financières.`,
    dataAccess: 'granted_companies',
    suggestedQuestions: [
      'Quel est le score bancaire de cette entreprise ?',
      'Quels sont les indicateurs de risque ?',
      'Résume la performance financière',
      'Exporte le rapport financier',
    ],
  },
};

export function getPersona(role: UserRole | null): AIPersona {
  if (!role) return AI_PERSONAS.EMPLOYEE;
  return AI_PERSONAS[role] ?? AI_PERSONAS.EMPLOYEE;
}
