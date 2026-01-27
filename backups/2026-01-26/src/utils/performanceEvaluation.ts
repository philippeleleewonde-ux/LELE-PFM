// src/utils/performanceEvaluation.ts

/**
 * Système d'évaluation de performance centré sur l'EFFORT et l'ENGAGEMENT
 * Vocabulaire interdit : "objectif(s)", "atteint", "manqué"
 * Vocabulaire valorisé : "effort", "implication", "engagement", "contribution"
 */

export interface PerformanceAppreciation {
  grade: string;
  label: string;           // Court : "Exceptionnel", "Bien", etc.
  description: string;     // Détaillé pour le bulletin (centré EFFORT)
  color: string;           // Couleur UI (hex)
  recommendations?: string; // Actions managériales suggérées
}

/**
 * Génère l'appréciation complète basée sur la note globale
 * @param globalScore - Note globale sur 10
 * @returns Objet PerformanceAppreciation complet
 */
export const getPerformanceAppreciation = (
  globalScore: number
): PerformanceAppreciation => {

  // CAS EDGE : Score invalide ou manquant
  if (globalScore == null || isNaN(globalScore) || globalScore < 0) {
    return {
      grade: 'N/A',
      label: 'Non évalué',
      description: 'Évaluation non disponible ou en cours.',
      color: '#94a3b8', // Gris neutre
    };
  }

  // Normalisation du score (sécurité)
  const score = Math.max(0, Math.min(10, globalScore));

  // ========== BARÈME À 7 NIVEAUX (CENTRÉ SUR L'EFFORT) ==========

  // NIVEAU 1 : Exceptionnel (9.0 - 10.0)
  if (score >= 9.0) {
    return {
      grade: 'A+',
      label: 'Exceptionnel',
      description: 'Efforts remarquables et constants tout au long de la période. Implication exemplaire dépassant largement les attentes. Modèle d\'engagement pour l\'ensemble de l\'équipe.',
      color: '#10b981', // Vert foncé
      recommendations: 'Performance d\'excellence. Candidat prioritaire pour des responsabilités élargies et missions stratégiques. Valoriser ce niveau d\'engagement exceptionnel.',
    };
  }

  // NIVEAU 2 : Excellent (8.0 - 8.9)
  if (score >= 8.0) {
    return {
      grade: 'A',
      label: 'Excellent',
      description: 'Efforts soutenus et de grande qualité. Engagement exemplaire avec une forte contribution tant sur le plan individuel que collectif.',
      color: '#22c55e', // Vert
      recommendations: 'Maintenir ce niveau d\'engagement. Opportunités de partage d\'expérience et de mentoring à valoriser. Reconnaître publiquement cette performance.',
    };
  }

  // NIVEAU 3 : Très bien (7.0 - 7.9)
  if (score >= 7.0) {
    return {
      grade: 'B+',
      label: 'Très bien',
      description: 'Efforts réguliers et conséquents sur l\'ensemble de la période. Engagement solide avec des résultats tangibles et une participation active.',
      color: '#3b82f6', // Bleu
      recommendations: 'Performance solide. Poursuivre les efforts actuels en identifiant les axes de progression vers l\'excellence. Envisager des projets à responsabilités accrues.',
    };
  }

  // NIVEAU 4 : Bien (6.0 - 6.9)
  if (score >= 6.0) {
    return {
      grade: 'B',
      label: 'Bien',
      description: 'Bons efforts fournis de manière générale. Engagement conforme aux attentes avec une implication positive dans les activités quotidiennes.',
      color: '#6366f1', // Indigo
      recommendations: 'Engagement satisfaisant. Continuer sur cette lancée en renforçant la régularité des efforts. Identifier les opportunités d\'amélioration continue.',
    };
  }

  // NIVEAU 5 : Satisfaisant (5.0 - 5.9)
  if (score >= 5.0) {
    return {
      grade: 'C+',
      label: 'Satisfaisant',
      description: 'Efforts acceptables mais irréguliers sur la période. Implication à renforcer pour améliorer la performance globale et la constance.',
      color: '#eab308', // Jaune
      recommendations: 'Accompagnement recommandé pour améliorer la régularité des efforts. Identifier les obstacles à l\'engagement et mettre en place un soutien adapté. Point mensuel conseillé.',
    };
  }

  // NIVEAU 6 : Insuffisant (4.0 - 4.9)
  if (score >= 4.0) {
    return {
      grade: 'C',
      label: 'Insuffisant',
      description: 'Efforts limités et peu réguliers sur la période. Manque d\'implication notable nécessitant un soutien rapproché pour redresser la situation.',
      color: '#f97316', // Orange
      recommendations: 'Plan de soutien obligatoire. Entretien RH pour identifier les difficultés et mettre en place des actions d\'accompagnement ciblées sous 30 jours. Suivi hebdomadaire requis.',
    };
  }

  // NIVEAU 7 : Très insuffisant (< 4.0)
  return {
    grade: 'D',
    label: 'Très insuffisant',
    description: 'Efforts très insuffisants avec un désengagement apparent. Situation nécessitant un accompagnement urgent et des mesures correctives immédiates.',
    color: '#ef4444', // Rouge
    recommendations: 'Action immédiate requise. Entretien tripartite (salarié/manager/RH) obligatoire sous 7 jours. Mise en place d\'un plan de remobilisation intensif ou réorientation professionnelle à envisager.',
  };
};

/**
 * Retourne uniquement le label court (ex: "Excellent")
 * @param globalScore - Note globale sur 10
 */
export const getShortAppreciation = (globalScore: number): string => {
  return getPerformanceAppreciation(globalScore).label;
};

/**
 * Retourne la description complète centrée sur l'effort
 * @param globalScore - Note globale sur 10
 */
export const getFullAppreciation = (globalScore: number): string => {
  return getPerformanceAppreciation(globalScore).description;
};

/**
 * Retourne les recommandations managériales (si disponibles)
 * @param globalScore - Note globale sur 10
 */
export const getRecommendations = (globalScore: number): string | undefined => {
  return getPerformanceAppreciation(globalScore).recommendations;
};

/**
 * Retourne le grade (ex: "A+", "B", "C")
 * @param globalScore - Note globale sur 10
 */
export const getGradeFromScore = (globalScore: number): string => {
  return getPerformanceAppreciation(globalScore).grade;
};

/**
 * Retourne la couleur du grade (hex)
 * @param globalScore - Note globale sur 10
 */
export const getGradeColorFromScore = (globalScore: number): string => {
  return getPerformanceAppreciation(globalScore).color;
};
