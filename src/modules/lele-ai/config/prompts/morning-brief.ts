import type { UserRole } from '@/types/roles';

/**
 * Prompt pour générer le Morning Brief.
 * Utilisé par le CRON de pré-calcul ou en fallback temps réel.
 */
export function buildMorningBriefPrompt(params: {
  role: UserRole;
  userName: string;
  language: string;
  companyName: string;
  daysSinceLastVisit: number;
  recentChanges: Record<string, unknown>;
}): string {
  const { role, userName, language, companyName, daysSinceLastVisit, recentChanges } = params;

  return `Génère un résumé de connexion (Morning Brief) pour un utilisateur de LELE HCM.

UTILISATEUR : ${userName}
RÔLE : ${role}
ENTREPRISE : ${companyName}
DERNIÈRE VISITE : il y a ${daysSinceLastVisit} jour(s)
LANGUE : ${language}

CHANGEMENTS DEPUIS LA DERNIÈRE VISITE :
${JSON.stringify(recentChanges, null, 2)}

CONSIGNES :
1. Réponds en ${language === 'fr' ? 'français' : language}.
2. Génère un JSON avec cette structure EXACTE (pas de texte autour, uniquement le JSON) :

{
  "greeting": "Salutation personnalisée avec le prénom",
  "sinceLast": "Durée depuis la dernière visite (ex: '3 jours')",
  "highlights": [
    {
      "type": "alert|positive|pending|info",
      "text": "Description courte de l'événement",
      "priority": "critical|high|medium|low",
      "action": "Texte du bouton d'action (optionnel)",
      "actionRoute": "Route de la page concernée (optionnel)"
    }
  ],
  "recommendation": "Une phrase de recommandation prioritaire"
}

RÈGLES :
- Maximum 4 highlights, triés par priorité décroissante.
- Adapte le contenu au rôle : un CEO veut la vision globale, un Employee veut ses données perso.
- Sois factuel : base-toi uniquement sur les données fournies.
- Si aucun changement notable, génère quand même un brief positif.`;
}
