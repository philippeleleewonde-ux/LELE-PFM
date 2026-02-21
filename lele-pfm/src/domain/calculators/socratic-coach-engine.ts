/**
 * Socratic Coach Engine — LELE PFM
 *
 * Analyzes an investment portfolio and generates thought-provoking Socratic
 * questions based on detected patterns. Pure rule-based system, no LLM.
 */

import type { AllocationRecommendation, AssetClass } from '@/types/investment';

// ─── Types ───

export type QuestionPriority = 'critical' | 'important' | 'educational';
export type QuestionCategory = 'risk' | 'diversification' | 'bias' | 'tax' | 'strategy' | 'psychology';

export interface SocraticQuestion {
  id: string;
  category: QuestionCategory;
  priority: QuestionPriority;
  question: string;
  insight: string;
  recommendation: string;
  triggerReason: string;
}

export interface SocraticSession {
  questions: SocraticQuestion[];
  coachingLevel: 'debutant' | 'intermediaire' | 'avance';
  focusArea: string;
  sessionSummary: string;
  totalIssuesDetected: number;
}

// ─── Helpers ───

function weightOf(
  allocations: AllocationRecommendation[],
  assets: AssetClass[],
): number {
  return allocations
    .filter((a) => assets.includes(a.product.asset))
    .reduce((sum, a) => sum + a.weight, 0);
}

function maxWeight(allocations: AllocationRecommendation[]): number {
  if (allocations.length === 0) return 0;
  return Math.max(...allocations.map((a) => a.weight));
}

function positionCount(allocations: AllocationRecommendation[]): number {
  return allocations.filter((a) => a.weight > 0).length;
}

function distinctAssetTypes(allocations: AllocationRecommendation[]): number {
  const set = new Set(allocations.filter((a) => a.weight > 0).map((a) => a.product.asset));
  return set.size;
}

function weightedAvgVolatility(allocations: AllocationRecommendation[]): number {
  const totalW = allocations.reduce((s, a) => s + a.weight, 0);
  if (totalW === 0) return 0;
  return allocations.reduce((s, a) => s + a.product.volatility * (a.weight / totalW), 0);
}

function weightedAvgReturn(allocations: AllocationRecommendation[]): number {
  const totalW = allocations.reduce((s, a) => s + a.weight, 0);
  if (totalW === 0) return 0;
  return allocations.reduce((s, a) => s + a.product.returnRate * (a.weight / totalW), 0);
}

// ─── Rule Definitions ───

interface Rule {
  id: string;
  category: QuestionCategory;
  priority: QuestionPriority;
  check: (allocs: AllocationRecommendation[]) => boolean;
  question: string;
  insight: string;
  recommendation: string;
  triggerReason: string;
}

const RULES: Rule[] = [
  // 1. Concentration > 40%
  {
    id: 'concentration_40',
    category: 'risk',
    priority: 'critical',
    check: (a) => maxWeight(a) > 40,
    question: 'Que se passerait-il si cet actif perdait 50% de sa valeur demain ?',
    insight:
      'Une concentration superieure a 40% sur un seul actif expose votre portefeuille a un risque specifique majeur. Si cet actif chute, c\'est tout votre patrimoine qui en souffre.',
    recommendation:
      'Reduisez votre position dominante a maximum 25-30% et redistribuez sur d\'autres classes d\'actifs pour amortir les chocs.',
    triggerReason: 'Un actif represente plus de 40% de votre portefeuille.',
  },
  // 2. 0% obligations
  {
    id: 'no_bonds',
    category: 'diversification',
    priority: 'important',
    check: (a) => weightOf(a, ['government_bonds', 'corporate_bonds', 'sukuk']) === 0,
    question: 'Pourquoi n\'avez-vous aucun filet de securite dans votre portefeuille ?',
    insight:
      'Les obligations jouent un role stabilisateur : elles limitent les pertes quand les marches actions chutent. Sans elles, votre portefeuille est entierement expose aux fluctuations.',
    recommendation:
      'Ajoutez 10-20% d\'obligations (souveraines ou sukuk) pour creer un socle defensif dans votre allocation.',
    triggerReason: 'Aucune allocation en obligations (souveraines, corporate ou sukuk).',
  },
  // 3. Home bias > 60%
  {
    id: 'home_bias',
    category: 'bias',
    priority: 'important',
    check: (a) => weightOf(a, ['local_stocks', 'tontine', 'micro_enterprise']) > 60,
    question: 'Si l\'economie locale ralentit, combien de vos investissements seraient touches ?',
    insight:
      'Le biais domestique vous concentre sur un seul marche. Si la conjoncture locale se degrade, tous vos actifs locaux souffrent simultanement.',
    recommendation:
      'Diversifiez au moins 30-40% de votre portefeuille vers des fonds indiciels internationaux ou des obligations libellees en devises fortes.',
    triggerReason: 'Plus de 60% de votre portefeuille est investi localement (actions locales, tontine, micro-entreprise).',
  },
  // 4. Crypto > 20%
  {
    id: 'crypto_heavy',
    category: 'risk',
    priority: 'critical',
    check: (a) => weightOf(a, ['crypto']) > 20,
    question: 'Etes-vous pret a voir cette partie de votre portefeuille perdre 80% en quelques mois ?',
    insight:
      'Les cryptomonnaies ont historiquement connu des baisses de 70-90% lors de chaque cycle baissier. A plus de 20% d\'allocation, l\'impact sur votre patrimoine serait devastateur.',
    recommendation:
      'Limitez votre exposition crypto a 5-10% maximum et utilisez la strategie DCA (achat regulier) pour lisser la volatilite.',
    triggerReason: 'Plus de 20% du portefeuille est alloue aux cryptomonnaies.',
  },
  // 5. No savings account
  {
    id: 'no_safety_cushion',
    category: 'strategy',
    priority: 'critical',
    check: (a) => weightOf(a, ['savings_account', 'money_market']) === 0,
    question: 'Avez-vous un coussin de securite en cas d\'urgence ?',
    insight:
      'Sans epargne de precaution liquide, un imprévu (sante, perte d\'emploi) pourrait vous forcer a vendre vos investissements au pire moment, a perte.',
    recommendation:
      'Gardez l\'equivalent de 3 a 6 mois de depenses sur un compte epargne ou un fonds monetaire facilement accessible.',
    triggerReason: 'Aucune allocation en epargne liquide (compte epargne ou monetaire).',
  },
  // 6. All risky > 70%
  {
    id: 'all_risky',
    category: 'psychology',
    priority: 'important',
    check: (a) =>
      weightOf(a, ['stock_index', 'local_stocks', 'crypto', 'micro_enterprise']) > 70,
    question: 'Comment reagiriez-vous si votre portefeuille perdait 40% en un mois ?',
    insight:
      'Un portefeuille a plus de 70% en actifs risques peut subir des drawdowns de 30-50%. La question n\'est pas si cela arrivera, mais quand.',
    recommendation:
      'Integrez 20-30% d\'actifs defensifs (obligations, or, monetaire) pour reduire la volatilite globale et mieux dormir la nuit.',
    triggerReason: 'Plus de 70% du portefeuille est en actifs volatils (actions, crypto, micro-entreprise).',
  },
  // 7. No real estate
  {
    id: 'no_real_estate',
    category: 'diversification',
    priority: 'educational',
    check: (a) => weightOf(a, ['real_estate_fund']) === 0,
    question: 'Avez-vous pense a l\'immobilier comme source de revenus passifs ?',
    insight:
      'L\'immobilier (via des fonds SCPI/REIT) offre des rendements reguliers et une protection partielle contre l\'inflation, tout en etant decorrel des marches actions.',
    recommendation:
      'Considerez une allocation de 5-15% en fonds immobiliers pour diversifier vos sources de revenus et stabiliser votre portefeuille.',
    triggerReason: 'Aucune allocation en immobilier (fonds immobilier).',
  },
  // 8. Only safe > 80%
  {
    id: 'only_safe',
    category: 'strategy',
    priority: 'important',
    check: (a) =>
      weightOf(a, ['savings_account', 'term_deposit', 'money_market']) > 80,
    question: 'L\'inflation grignote votre epargne chaque annee. Le saviez-vous ?',
    insight:
      'Avec une inflation de 3-5% par an, un portefeuille a 80% en actifs sans risque perd du pouvoir d\'achat reel chaque annee. Votre argent travaille contre vous.',
    recommendation:
      'Diversifiez progressivement vers des actifs de croissance (fonds indiciels, obligations) pour au minimum compenser l\'inflation.',
    triggerReason: 'Plus de 80% du portefeuille est en actifs a tres faible rendement (epargne, depots, monetaire).',
  },
  // 9. No gold
  {
    id: 'no_gold',
    category: 'diversification',
    priority: 'educational',
    check: (a) => weightOf(a, ['gold']) === 0,
    question: 'Savez-vous que l\'or protege historiquement contre les crises et l\'inflation ?',
    insight:
      'L\'or est une valeur refuge qui tend a monter quand les marches actions chutent. Il offre une couverture naturelle contre l\'inflation et les crises geopolitiques.',
    recommendation:
      'Une allocation de 5-10% en or peut reduire la volatilite globale de votre portefeuille et servir d\'assurance en temps de crise.',
    triggerReason: 'Aucune allocation en or dans le portefeuille.',
  },
  // 10. Too many assets (> 8)
  {
    id: 'too_many_assets',
    category: 'strategy',
    priority: 'educational',
    check: (a) => positionCount(a) > 8,
    question: 'Suivez-vous vraiment chacun de vos investissements avec attention ?',
    insight:
      'Au-dela de 8 positions, la complexite de gestion augmente et les petites positions n\'ont plus d\'impact significatif. Vous risquez la "diworsification".',
    recommendation:
      'Consolidez vos positions les plus petites et concentrez-vous sur 5-8 investissements que vous comprenez et suivez activement.',
    triggerReason: 'Plus de 8 positions actives dans le portefeuille.',
  },
  // 11. Too few assets (< 3)
  {
    id: 'too_few_assets',
    category: 'diversification',
    priority: 'important',
    check: (a) => positionCount(a) > 0 && positionCount(a) < 3,
    question: 'Mettre tous ses oeufs dans le meme panier — est-ce vraiment prudent ?',
    insight:
      'Avec moins de 3 positions, un seul evenement negatif peut impacter massivement votre portefeuille. La diversification est le seul "repas gratuit" en finance.',
    recommendation:
      'Elargissez votre portefeuille a au moins 4-5 classes d\'actifs differentes pour reduire le risque specifique.',
    triggerReason: 'Moins de 3 positions actives dans le portefeuille.',
  },
  // 12. High volatility portfolio
  {
    id: 'high_volatility',
    category: 'risk',
    priority: 'important',
    check: (a) => weightedAvgVolatility(a) > 20,
    question: 'Pourriez-vous dormir tranquille si votre portefeuille oscillait de 20% par mois ?',
    insight:
      'Une volatilite moyenne ponderee superieure a 20% signifie que votre portefeuille peut fluctuer de facon extreme. Cela teste les nerfs de tout investisseur.',
    recommendation:
      'Ajoutez des actifs a faible volatilite (obligations, monetaire, or) pour ramener la volatilite globale sous 15%.',
    triggerReason: 'La volatilite moyenne ponderee du portefeuille depasse 20%.',
  },
  // 13. Low return portfolio
  {
    id: 'low_return',
    category: 'strategy',
    priority: 'important',
    check: (a) => {
      const avgRet = weightedAvgReturn(a);
      return avgRet > 0 && avgRet < 3;
    },
    question: 'Votre portefeuille rapporte-t-il plus que l\'inflation ?',
    insight:
      'Avec un rendement moyen inferieur a 3%, votre portefeuille risque de ne pas compenser l\'inflation. En termes reels, vous perdez de l\'argent.',
    recommendation:
      'Integrez progressivement des actifs a meilleur rendement (fonds indiciels, immobilier) tout en restant dans votre tolerance au risque.',
    triggerReason: 'Le rendement moyen pondere du portefeuille est inferieur a 3%.',
  },
  // 14. No Sharia option
  {
    id: 'no_sharia',
    category: 'strategy',
    priority: 'educational',
    check: (a) => weightOf(a, ['sukuk']) === 0,
    question: 'Avez-vous explore les options d\'investissement conformes a vos valeurs ?',
    insight:
      'Les sukuk et les fonds conformes a la Sharia offrent des rendements competitifs tout en respectant des principes ethiques. Investir selon ses valeurs n\'implique pas de sacrifier la performance.',
    recommendation:
      'Renseignez-vous sur les sukuk et les fonds islamiques comme alternative aux obligations classiques si cela correspond a vos convictions.',
    triggerReason: 'Aucune allocation en sukuk dans le portefeuille.',
  },
  // 15. Tontine heavy > 25%
  {
    id: 'tontine_heavy',
    category: 'risk',
    priority: 'important',
    check: (a) => weightOf(a, ['tontine']) > 25,
    question: 'La tontine est-elle vraiment diversifiee ou concentree sur un seul risque ?',
    insight:
      'La tontine depend souvent d\'un cercle restreint de personnes et d\'un engagement a long terme. En cas de defaut d\'un ou plusieurs membres, c\'est votre capital qui est en jeu.',
    recommendation:
      'Limitez la tontine a 10-15% de votre portefeuille et diversifiez le reste dans des instruments financiers plus liquides et regulementes.',
    triggerReason: 'Plus de 25% du portefeuille est en tontine.',
  },
  // 16. Micro enterprise heavy > 20%
  {
    id: 'micro_enterprise_heavy',
    category: 'risk',
    priority: 'important',
    check: (a) => weightOf(a, ['micro_enterprise']) > 20,
    question: 'Quel est votre plan si votre micro-entreprise traverse une mauvaise passe ?',
    insight:
      'La micro-entreprise concentre le risque entrepreneurial et le risque d\'investissement au meme endroit. Si l\'activite ralentit, votre revenu ET votre patrimoine sont touches.',
    recommendation:
      'Diversifiez votre patrimoine hors de votre activite professionnelle. Investissez au moins 50% dans des actifs decoreles de votre micro-entreprise.',
    triggerReason: 'Plus de 20% du portefeuille est en micro-entreprise.',
  },
  // 17. No international
  {
    id: 'no_international',
    category: 'diversification',
    priority: 'important',
    check: (a) => weightOf(a, ['stock_index', 'mutual_fund']) === 0,
    question: 'Avez-vous pense aux marches internationaux pour diversifier vos risques ?',
    insight:
      'En restant uniquement sur des actifs locaux, vous ne profitez pas de la croissance des autres economies. Les fonds indiciels mondiaux offrent une diversification geographique instantanee.',
    recommendation:
      'Allouez 15-25% de votre portefeuille a des fonds indiciels internationaux (MSCI World, S&P 500) pour capter la croissance mondiale.',
    triggerReason: 'Aucune allocation en fonds indiciels ou fonds communs de placement internationaux.',
  },
  // 18. Term deposit locked > 40%
  {
    id: 'term_deposit_locked',
    category: 'strategy',
    priority: 'important',
    check: (a) => weightOf(a, ['term_deposit']) > 40,
    question: 'Que feriez-vous si vous aviez besoin de cet argent avant l\'echeance ?',
    insight:
      'Les depots a terme offrent un rendement garanti mais bloquent votre capital. Avec plus de 40% immobilise, vous manquez de flexibilite en cas de besoin urgent ou d\'opportunite.',
    recommendation:
      'Echelonnez vos depots a terme (methode de l\'echelle) avec des echeances differentes pour garder de la liquidite a intervalles reguliers.',
    triggerReason: 'Plus de 40% du portefeuille est en depots a terme bloques.',
  },
  // 19. Balanced but no rebalancing awareness
  {
    id: 'rebalancing_awareness',
    category: 'strategy',
    priority: 'educational',
    check: (a) => distinctAssetTypes(a) >= 4,
    question: 'Savez-vous quand et comment reequilibrer votre portefeuille ?',
    insight:
      'Un portefeuille diversifie se desaligne naturellement avec le temps. Sans reequilibrage periodique, vous pouvez vous retrouver surexposes aux actifs qui ont le plus monte.',
    recommendation:
      'Reequilibrez votre portefeuille tous les 6 a 12 mois, ou lorsqu\'une position depasse de plus de 5 points sa cible initiale.',
    triggerReason: '4 types d\'actifs ou plus : le reequilibrage periodique devient important.',
  },
  // 20. Few issues — well-constructed portfolio
  {
    id: 'well_constructed',
    category: 'strategy',
    priority: 'educational',
    check: () => true, // Always checked, but only used as fallback (see logic below)
    question: 'Votre portefeuille semble bien construit. Quels sont vos objectifs pour les 5 prochaines annees ?',
    insight:
      'Un bon portefeuille est un excellent debut, mais il doit etre aligne avec vos objectifs de vie. Retraite, achat immobilier, education des enfants — chaque objectif necessite une strategie differente.',
    recommendation:
      'Definissez 2-3 objectifs financiers precis avec des echeances, puis verifiez que votre allocation actuelle est coherente avec ces horizons.',
    triggerReason: 'Peu de problemes detectes dans votre portefeuille.',
  },
];

// ─── Focus Area Labels ───

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  risk: 'Gestion des risques',
  diversification: 'Diversification',
  bias: 'Biais comportementaux',
  tax: 'Optimisation fiscale',
  strategy: 'Strategie d\'allocation',
  psychology: 'Psychologie de l\'investisseur',
};

// ─── Main Function ───

export function generateSocraticSession(
  allocations: AllocationRecommendation[],
): SocraticSession {
  // Collect triggered questions from rules 1-19 (skip rule 20 for now)
  const triggered: SocraticQuestion[] = [];

  for (const rule of RULES) {
    if (rule.id === 'well_constructed') continue; // handled below
    if (!rule.check(allocations)) continue;

    triggered.push({
      id: rule.id,
      category: rule.category,
      priority: rule.priority,
      question: rule.question,
      insight: rule.insight,
      recommendation: rule.recommendation,
      triggerReason: rule.triggerReason,
    });
  }

  const totalIssuesDetected = triggered.length;

  // If few issues (<=2), add the "well_constructed" question
  if (totalIssuesDetected <= 2) {
    const wellRule = RULES.find((r) => r.id === 'well_constructed')!;
    triggered.push({
      id: wellRule.id,
      category: wellRule.category,
      priority: wellRule.priority,
      question: wellRule.question,
      insight: wellRule.insight,
      recommendation: wellRule.recommendation,
      triggerReason: wellRule.triggerReason,
    });
  }

  // Coaching level
  let coachingLevel: SocraticSession['coachingLevel'];
  if (totalIssuesDetected <= 3) coachingLevel = 'avance';
  else if (totalIssuesDetected <= 7) coachingLevel = 'intermediaire';
  else coachingLevel = 'debutant';

  // Focus area: most common category
  const catCounts = new Map<QuestionCategory, number>();
  for (const q of triggered) {
    catCounts.set(q.category, (catCounts.get(q.category) ?? 0) + 1);
  }
  let topCat: QuestionCategory = 'strategy';
  let topCount = 0;
  for (const [cat, count] of catCounts) {
    if (count > topCount) {
      topCount = count;
      topCat = cat;
    }
  }
  const focusArea = CATEGORY_LABELS[topCat];

  // Sort: critical first, then important, then educational
  const priorityOrder: Record<QuestionPriority, number> = {
    critical: 0,
    important: 1,
    educational: 2,
  };
  triggered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Limit to top 7
  const questions = triggered.slice(0, 7);

  // Session summary
  const levelLabels: Record<SocraticSession['coachingLevel'], string> = {
    debutant: 'debutant',
    intermediaire: 'intermediaire',
    avance: 'avance',
  };
  let sessionSummary: string;
  if (totalIssuesDetected === 0) {
    sessionSummary =
      'Votre portefeuille est bien construit. Le coach vous invite a reflechir a vos objectifs long terme.';
  } else if (totalIssuesDetected <= 3) {
    sessionSummary =
      `${totalIssuesDetected} point${totalIssuesDetected > 1 ? 's' : ''} d'attention detecte${totalIssuesDetected > 1 ? 's' : ''}. ` +
      `Votre profil est ${levelLabels[coachingLevel]} — quelques ajustements suffiraient a renforcer votre strategie.`;
  } else {
    sessionSummary =
      `${totalIssuesDetected} points d'attention detectes. ` +
      `Le coach recommande de se concentrer sur ${focusArea.toLowerCase()} en priorite.`;
  }

  return {
    questions,
    coachingLevel,
    focusArea,
    sessionSummary,
    totalIssuesDetected,
  };
}
