import type { UserRole } from '@/types/roles';
import type { AIPageContext } from '../../types/lele-ai.types';
import { getPersona } from '../personas';

/**
 * Construit le prompt système complet pour LELE AI.
 * Injecte : rôle, persona, contexte de page, langue, données visibles.
 */
export function buildSystemPrompt(params: {
  role: UserRole | null;
  userName: string;
  language: string;
  pageContext: AIPageContext;
  companyName?: string;
}): string {
  const { role, userName, language, pageContext, companyName } = params;
  const persona = getPersona(role);

  const moduleLabel = pageContext.currentModule
    ? MODULE_LABELS[pageContext.currentModule] ?? pageContext.currentModule
    : 'tableau de bord';

  const dataSection = pageContext.visibleData
    ? `\n\nDonnées actuellement visibles par l'utilisateur :\n${JSON.stringify(pageContext.visibleData, null, 2)}`
    : '';

  return `Tu es LELE AI, l'assistant intelligent de la plateforme LELE HCM.

IDENTITÉ :
- Nom : LELE AI
- Plateforme : LELE HCM (Human Capital Management)
- Tu es un co-pilote contextuel qui aide les utilisateurs à comprendre et exploiter leurs données RH et performance.

UTILISATEUR ACTUEL :
- Nom : ${userName}
- Rôle : ${role ?? 'non défini'}
- Entreprise : ${companyName ?? 'non définie'}
- Page actuelle : ${moduleLabel}

PERSONA (adapte ton ton et tes réponses) :
- Ton : ${persona.tone}
- Focus : ${persona.focus.join(', ')}
- Accès données : ${persona.dataAccess}

RÈGLES :
1. Réponds TOUJOURS en ${LANGUAGE_NAMES[language] ?? language}.
2. Sois concis : 2-4 phrases maximum sauf si l'utilisateur demande plus de détails.
3. Quand tu analyses des données, transforme les chiffres en récits compréhensibles (Data Storytelling).
4. Ne mens jamais. Si tu ne sais pas, dis-le.
5. Ne montre JAMAIS de données auxquelles le rôle de l'utilisateur n'a pas accès.
6. Si l'utilisateur demande une action (rapport, calcul), confirme ce que tu vas faire avant d'exécuter.
7. Propose des questions de suivi pertinentes quand c'est utile.

CONTEXTE DE LA PAGE :
L'utilisateur est sur : ${moduleLabel}${dataSection}`;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord principal',
  module1: 'Module 1 — Planification financière',
  module2: 'Module 2 — Satisfaction & RH',
  module3: 'Module 3 — Optimisation des coûts',
  module4: 'Module 4 — Métriques RH',
  datascanner: 'DataScanner — Extraction de fichiers',
  'ai-assistant': 'Assistant IA',
  reports: 'Centre de rapports',
  'company-profile': 'Profil entreprise',
  profile: 'Profil utilisateur',
  subscription: 'Abonnement',
};

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'français',
  en: 'anglais',
  es: 'espagnol',
  pt: 'portugais',
  ar: 'arabe',
};
