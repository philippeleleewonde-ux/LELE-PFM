/**
 * 5 Indicateurs de Performance Financière Personnelle
 * Parallèle HCM : ABS, DFQ, ADT, EPD, EKH
 *
 * Chaque indicateur représente une compétence comportementale
 * dont la faiblesse génère un coût financier mesurable.
 * Le poids = taille de la faiblesse = potentiel de récupération.
 *
 * CALIBRATION : Février 2026
 */

export interface PFMIndicator {
  code: string;       // REG, PRE, SEC, EFF, LIT
  name: string;       // Nom FR
  hcmParallel: string; // Indicateur HCM parallèle
  description: string; // Ce que ça mesure
  challenge: string;  // Le défi pour l'utilisateur
  icon: string;       // Nom icône lucide
  color: string;      // Couleur thème
}

export const PFM_INDICATORS: PFMIndicator[] = [
  {
    code: 'REG',
    name: 'Régularité d\'Épargne',
    hcmParallel: 'ABS',
    description: 'Capacité à épargner régulièrement',
    challenge: 'Mettre de côté chaque mois',
    icon: 'PiggyBank',
    color: '#4ADE80',
  },
  {
    code: 'PRE',
    name: 'Précision Budgétaire',
    hcmParallel: 'DFQ',
    description: 'Maîtrise de vos dettes et engagements',
    challenge: 'Respecter votre budget chaque semaine',
    icon: 'Target',
    color: '#60A5FA',
  },
  {
    code: 'SEC',
    name: 'Sécurité Financière',
    hcmParallel: 'ADT',
    description: 'Protection contre les imprévus',
    challenge: 'Renforcer vos protections',
    icon: 'Shield',
    color: '#FDBA74',
  },
  {
    code: 'EFF',
    name: 'Efficience des Revenus',
    hcmParallel: 'EPD',
    description: 'Optimisation de vos sources de revenus',
    challenge: 'Diversifier et stabiliser vos revenus',
    icon: 'TrendingUp',
    color: '#A78BFA',
  },
  {
    code: 'LIT',
    name: 'Littératie Financière',
    hcmParallel: 'EKH',
    description: 'Vos connaissances et réflexes financiers',
    challenge: 'Améliorer vos compétences financières',
    icon: 'GraduationCap',
    color: '#FBBF24',
  },
];

/**
 * Calcule les poids (rates) des 5 indicateurs à partir des données wizard.
 *
 * Logique : score de risque élevé = faiblesse = besoin élevé = poids fort
 * Le poids représente le potentiel de récupération en améliorant cette compétence.
 *
 * Parallèle HCM : 6 domaines socio-économiques → 5 indicatorRates → PPR distribution
 * PFM          : 6 domaines risque wizard     → 5 indicatorRates → EPR distribution
 *
 * @param rawRiskScores - Scores bruts du wizard (0-100 par domaine)
 * @param ekhScores - Scores EKH {e: 0-5, k: 0-5, h: 0-5}
 * @returns Record<code, rate> où rate est en % (somme = 100%)
 */
export function calculateIndicatorRates(
  rawRiskScores: Record<string, number>,
  ekhScores: { e: number; k: number; h: number }
): Record<string, number> {
  // Poids bruts : risque élevé = faiblesse = poids élevé (potentiel de récupération)
  const regWeight = rawRiskScores['epargne'] ?? 50;
  const preWeight = rawRiskScores['endettement'] ?? 50;
  const secWeight = Math.round(
    ((rawRiskScores['sante'] ?? 50) +
     (rawRiskScores['logement'] ?? 50) +
     (rawRiskScores['juridique'] ?? 50)) / 3
  );
  const effWeight = rawRiskScores['emploi'] ?? 50;
  // LIT inversé : EKH score bas (0-15) = faiblesse élevée
  const ekhTotal = ekhScores.e + ekhScores.k + ekhScores.h;
  const litWeight = Math.max(0, Math.round(100 - (ekhTotal / 15) * 100));

  const rawWeights: Record<string, number> = {
    REG: regWeight,
    PRE: preWeight,
    SEC: secWeight,
    EFF: effWeight,
    LIT: litWeight,
  };

  const totalWeight = Object.values(rawWeights).reduce((a, b) => a + b, 0);

  // Protection division par zéro : distribuer équitablement
  if (totalWeight === 0) {
    return { REG: 20, PRE: 20, SEC: 20, EFF: 20, LIT: 20 };
  }

  const rates: Record<string, number> = {};
  for (const [code, weight] of Object.entries(rawWeights)) {
    rates[code] = Math.round((weight / totalWeight) * 10000) / 100;
  }

  return rates;
}

/**
 * Retourne les poids bruts (avant normalisation) pour chaque indicateur.
 * Utilisé pour l'affichage dans les cartes indicateurs.
 */
export function getRawIndicatorWeights(
  rawRiskScores: Record<string, number>,
  ekhScores: { e: number; k: number; h: number }
): Record<string, number> {
  const ekhTotal = ekhScores.e + ekhScores.k + ekhScores.h;
  return {
    REG: rawRiskScores['epargne'] ?? 50,
    PRE: rawRiskScores['endettement'] ?? 50,
    SEC: Math.round(
      ((rawRiskScores['sante'] ?? 50) +
       (rawRiskScores['logement'] ?? 50) +
       (rawRiskScores['juridique'] ?? 50)) / 3
    ),
    EFF: rawRiskScores['emploi'] ?? 50,
    LIT: Math.max(0, Math.round(100 - (ekhTotal / 15) * 100)),
  };
}
