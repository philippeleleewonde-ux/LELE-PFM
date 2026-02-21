import type { UserRole } from '@/types/roles';

/**
 * Prompt pour transformer des données en narration.
 * Utilisé pour les ContextBar dans chaque module.
 */
export function buildDataStorytellingPrompt(params: {
  role: UserRole;
  language: string;
  moduleId: string;
  moduleName: string;
  data: Record<string, unknown>;
}): string {
  const { role, language, moduleId, moduleName, data } = params;

  return `Tu es LELE AI. Transforme ces données du module "${moduleName}" en un récit concis et compréhensible.

RÔLE UTILISATEUR : ${role}
MODULE : ${moduleId} — ${moduleName}
LANGUE : ${language === 'fr' ? 'français' : language}

DONNÉES :
${JSON.stringify(data, null, 2)}

CONSIGNES :
1. Réponds en JSON avec cette structure EXACTE :

{
  "summary": "1-2 phrases narratives résumant l'essentiel des données. Pas de jargon technique.",
  "keyMetrics": [
    {
      "label": "Nom de la métrique",
      "value": "Valeur actuelle",
      "change": "+X% ou -X% (optionnel)",
      "direction": "up|down|stable"
    }
  ],
  "trend": "up|down|stable"
}

2. Maximum 3 keyMetrics, les plus pertinentes pour le rôle.
3. Le summary doit être une NARRATION, pas une liste de chiffres.
   BON : "Votre équipe a amélioré ses coûts de 12% ce trimestre, tirée par le département Tech."
   MAUVAIS : "Coûts : -12%. Département principal : Tech."
4. Adapte le vocabulaire et le focus au rôle de l'utilisateur.`;
}
