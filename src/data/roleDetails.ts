import type { UserRole } from '@/types/roles';

export interface RoleDetails {
  objective: string;
  features: string[];
  benefits: string[];
  usps: string[];
}

export const roleDetailsMap: Record<UserRole, RoleDetails> = {
  CONSULTANT: {
    objective: "Accompagner vos clients entreprises dans l'optimisation de leur performance RH et financière",
    features: [
      "Accès multi-entreprises à vos clients",
      "Tableaux de bord consolidés inter-entreprises",
      "Export de rapports professionnels personnalisés",
      "Outils de benchmarking sectoriel"
    ],
    benefits: [
      "Réduisez de 70% le temps d'analyse des données clients",
      "Générez des insights actionnables en temps réel",
      "Gagnez 10-15h/semaine sur la production de rapports",
      "Augmentez votre valeur perçue auprès de vos clients"
    ],
    usps: [
      "Lauréat World Finance Innovation Awards 2025",
      "Conformité SASB/TCFD/ISO 30414 intégrée",
      "Données cross-entreprises sécurisées (SOC2 Type II)",
      "Intelligence artificielle pour recommandations stratégiques"
    ]
  },
  BANQUIER: {
    objective: "Évaluer la santé RH et financière de vos clients entreprises pour une meilleure analyse de risque",
    features: [
      "Vue d'ensemble performance RH des entreprises clientes",
      "Indicateurs de risque RH (turnover, engagement, masse salariale)",
      "Rapports d'audit RH automatisés",
      "Alertes en temps réel sur signaux faibles"
    ],
    benefits: [
      "Réduisez de 50% le temps d'évaluation crédit",
      "Anticipez les risques RH avant impact financier",
      "Améliorez la précision de vos scoring de crédit",
      "Différenciez-vous avec des analyses RH innovantes"
    ],
    usps: [
      "Seule plateforme RH-Finance intégrée du marché",
      "Données RH auditables pour décisions de financement",
      "Conformité GDPR/SOC2 garantie",
      "API bancaire sécurisée pour intégration ERP"
    ]
  },
  CEO: {
    objective: "Piloter la performance globale de votre entreprise avec une vision 360° RH, finance et stratégie",
    features: [
      "Dashboard exécutif temps réel (RH + Finance)",
      "Indicateurs clés de performance (KPI) consolidés",
      "Scénarios prédictifs IA pour décisions stratégiques",
      "Suivi objectifs OKR et alignement équipes"
    ],
    benefits: [
      "Prenez des décisions data-driven en 5 minutes au lieu de 2 jours",
      "Augmentez la rentabilité de 15-20% via optimisation RH",
      "Réduisez le turnover de 30% grâce aux alertes précoces",
      "Gagnez 20h/mois sur le reporting management"
    ],
    usps: [
      "Vision unifiée RH-Finance-Stratégie (unique sur le marché)",
      "IA prédictive pour anticiper besoins en effectifs",
      "Conformité ESG/ISO 30414 pour reporting extra-financier",
      "Lauréat World Finance Innovation Awards 2025"
    ]
  },
  RH_MANAGER: {
    objective: "Gérer l'engagement, la satisfaction et la performance RH de vos équipes de manière data-driven",
    features: [
      "Tableau de bord RH complet (engagement, turnover, absentéisme)",
      "Enquêtes de satisfaction automatisées",
      "Gestion des talents et plans de développement",
      "Analytics RH avancées avec IA prédictive"
    ],
    benefits: [
      "Augmentez l'engagement employé de 25% en 6 mois",
      "Réduisez le turnover de 30% via alertes précoces",
      "Économisez 15h/semaine sur le reporting RH",
      "Améliorez le taux de réponse aux enquêtes de 40%"
    ],
    usps: [
      "Conformité ISO 30414 (norme mondiale reporting RH)",
      "IA pour prédire les départs et risques d'épuisement",
      "Enquêtes scientifiquement validées (Gallup, eNPS)",
      "Intégration SIRH existants (SAP, Workday, Oracle)"
    ]
  },
  EMPLOYEE: {
    objective: "Consulter vos performances, participer aux enquêtes et suivre votre développement professionnel",
    features: [
      "Dashboard personnel de vos performances",
      "Participation enquêtes de satisfaction anonymes",
      "Suivi de vos objectifs et développement",
      "Accès à vos feedbacks et évaluations"
    ],
    benefits: [
      "Visibilité transparente sur votre contribution et performance",
      "Participez activement à l'amélioration de votre entreprise",
      "Suivez votre progression de carrière en temps réel",
      "Recevez des feedbacks constructifs réguliers"
    ],
    usps: [
      "Interface intuitive accessible 24/7 (mobile + desktop)",
      "Anonymat garanti pour les enquêtes de satisfaction",
      "Données personnelles sécurisées (GDPR/SOC2)",
      "Outil de développement de carrière intégré"
    ]
  },
  TEAM_LEADER: {
    objective: "Encadrer votre équipe avec des insights data pour améliorer performance et engagement",
    features: [
      "Dashboard performance équipe en temps réel",
      "Suivi de l'engagement et satisfaction de vos N-1",
      "Outils de feedback 360° et one-on-ones",
      "Alertes sur signaux faibles (risque burnout, désengagement)"
    ],
    benefits: [
      "Augmentez la performance équipe de 20% en 3 mois",
      "Réduisez le turnover de votre équipe de 35%",
      "Anticipez les problèmes avant qu'ils n'éclatent",
      "Gagnez 8h/mois sur le reporting managérial"
    ],
    usps: [
      "IA pour identifier signaux faibles (burnout, désengagement)",
      "Coaching managérial intégré basé sur data",
      "Benchmarking avec autres équipes de l'entreprise",
      "Conformité WCAG 2.1 AA (accessibilité)"
    ]
  }
};
