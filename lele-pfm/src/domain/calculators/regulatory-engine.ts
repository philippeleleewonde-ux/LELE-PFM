/**
 * Regulatory Compliance Scanner — LELE PFM
 *
 * Pure functions that evaluate an investment allocation against
 * 4 regulatory / ethical frameworks: Sharia, ESG, Prudential, Liquidity.
 */

import { AllocationRecommendation, AssetClass } from '@/types/investment';

// ─── Types ───

export type ComplianceFramework = 'sharia' | 'esg' | 'prudential' | 'liquidity';

export type RuleStatus = 'compliant' | 'warning' | 'violation';

export interface ComplianceRule {
  id: string;
  framework: ComplianceFramework;
  rule: string;            // French rule description
  status: RuleStatus;
  details: string;         // French explanation
  affectedAssets: string[];
  remediation: string;     // French fix suggestion
}

export interface FrameworkResult {
  framework: ComplianceFramework;
  label: string;
  description: string;
  score: number;           // 0-100
  grade: string;           // A+ to E
  rules: ComplianceRule[];
  compliantCount: number;
  warningCount: number;
  violationCount: number;
  summary: string;
}

export interface ComplianceAnalysis {
  frameworks: FrameworkResult[];
  globalScore: number;         // Average of all framework scores
  globalGrade: string;
  criticalViolations: ComplianceRule[];   // All violations across frameworks
  summary: string;
  topActions: string[];        // Top 5 remediation actions
}

// ─── Helpers ───

function weightOf(allocations: AllocationRecommendation[], ...assets: AssetClass[]): number {
  return allocations
    .filter((a) => assets.includes(a.product.asset))
    .reduce((sum, a) => sum + a.weight, 0);
}

function distinctAssetClasses(allocations: AllocationRecommendation[]): number {
  return new Set(allocations.map((a) => a.product.asset)).size;
}

function hasAsset(allocations: AllocationRecommendation[], ...assets: AssetClass[]): boolean {
  return allocations.some((a) => assets.includes(a.product.asset));
}

function assetsPresent(allocations: AllocationRecommendation[], ...assets: AssetClass[]): string[] {
  return allocations
    .filter((a) => assets.includes(a.product.asset))
    .map((a) => a.product.name);
}

function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

// ─── Framework: SHARIA ───

const INTEREST_BEARING: AssetClass[] = [
  'savings_account',
  'term_deposit',
  'corporate_bonds',
  'government_bonds',
  'money_market',
];

function evaluateSharia(allocations: AllocationRecommendation[]): FrameworkResult {
  const rules: ComplianceRule[] = [];

  // 1. No interest-bearing instruments
  const interestWeight = weightOf(allocations, ...INTEREST_BEARING);
  const interestAssets = assetsPresent(allocations, ...INTEREST_BEARING);
  rules.push({
    id: 'sharia_no_interest',
    framework: 'sharia',
    rule: 'Pas d\'instruments à intérêt (riba)',
    status: interestWeight > 0 ? 'violation' : 'compliant',
    details:
      interestWeight > 0
        ? `${interestWeight.toFixed(0)}% du portefeuille est en instruments à intérêt`
        : 'Aucun instrument à intérêt détecté',
    affectedAssets: interestAssets,
    remediation: 'Remplacer les obligations et dépôts par des Sukuk ou fonds islamiques',
  });

  // 2. No gambling / excessive speculation
  const cryptoWeight = weightOf(allocations, 'crypto');
  rules.push({
    id: 'sharia_no_gambling',
    framework: 'sharia',
    rule: 'Pas de spéculation excessive (gharar/maysir)',
    status: cryptoWeight > 10 ? 'warning' : 'compliant',
    details:
      cryptoWeight > 10
        ? `Crypto représente ${cryptoWeight.toFixed(0)}% (seuil: 10%)`
        : `Crypto à ${cryptoWeight.toFixed(0)}%, dans les limites`,
    affectedAssets: assetsPresent(allocations, 'crypto'),
    remediation: 'Réduire la part crypto à moins de 10%',
  });

  // 3. Halal sectors only
  const stockWeight = weightOf(allocations, 'stock_index');
  rules.push({
    id: 'sharia_halal_sectors',
    framework: 'sharia',
    rule: 'Secteurs halal uniquement',
    status: stockWeight > 0 ? 'warning' : 'compliant',
    details:
      stockWeight > 0
        ? `${stockWeight.toFixed(0)}% en indices boursiers (vérification halal requise)`
        : 'Pas d\'exposition aux indices non-filtrés',
    affectedAssets: assetsPresent(allocations, 'stock_index'),
    remediation: 'Privilégier les fonds indiciels filtrés halal',
  });

  // 4. Sukuk preferred
  const hasSukuk = hasAsset(allocations, 'sukuk');
  rules.push({
    id: 'sharia_sukuk',
    framework: 'sharia',
    rule: 'Sukuk recommandés pour le revenu fixe',
    status: hasSukuk ? 'compliant' : 'warning',
    details: hasSukuk
      ? 'Sukuk présents dans le portefeuille'
      : 'Aucun Sukuk — envisagez d\'en ajouter pour le revenu fixe',
    affectedAssets: assetsPresent(allocations, 'sukuk'),
    remediation: 'Ajouter des Sukuk comme alternative conforme aux obligations',
  });

  // 5. Zakat awareness
  rules.push({
    id: 'sharia_zakat',
    framework: 'sharia',
    rule: 'Sensibilisation Zakat (2,5% annuel)',
    status: 'compliant',
    details: 'Rappel : calculez votre Zakat annuelle sur les actifs éligibles',
    affectedAssets: [],
    remediation: 'Prévoir le calcul de la Zakat sur les actifs éligibles',
  });

  return buildFrameworkResult(
    'sharia',
    'Conformité Charia',
    'Vérification de la conformité aux principes de la finance islamique',
    rules,
  );
}

// ─── Framework: ESG ───

function evaluateESG(allocations: AllocationRecommendation[]): FrameworkResult {
  const rules: ComplianceRule[] = [];

  // 1. No fossil fuel exposure
  const stockIndexWeight = weightOf(allocations, 'stock_index');
  rules.push({
    id: 'esg_no_fossil',
    framework: 'esg',
    rule: 'Exposition fossile limitée',
    status: stockIndexWeight > 30 ? 'warning' : 'compliant',
    details:
      stockIndexWeight > 30
        ? `${stockIndexWeight.toFixed(0)}% en indices (seuil: 30%)`
        : `Indices à ${stockIndexWeight.toFixed(0)}%, dans les limites`,
    affectedAssets: assetsPresent(allocations, 'stock_index'),
    remediation: 'Passer à des ETF ESG excluant les énergies fossiles',
  });

  // 2. Green exposure
  const greenWeight = weightOf(allocations, 'real_estate_fund', 'mutual_fund');
  rules.push({
    id: 'esg_green',
    framework: 'esg',
    rule: 'Exposition verte suffisante (>10%)',
    status: greenWeight >= 10 ? 'compliant' : 'warning',
    details:
      greenWeight >= 10
        ? `${greenWeight.toFixed(0)}% en fonds verts potentiels`
        : `Seulement ${greenWeight.toFixed(0)}% en fonds verts (recommandé: >10%)`,
    affectedAssets: assetsPresent(allocations, 'real_estate_fund', 'mutual_fund'),
    remediation: 'Ajouter des fonds immobiliers durables ou fonds mutuels ESG',
  });

  // 3. Social impact
  const socialImpact = hasAsset(allocations, 'tontine', 'micro_enterprise');
  rules.push({
    id: 'esg_social',
    framework: 'esg',
    rule: 'Impact social direct',
    status: socialImpact ? 'compliant' : 'warning',
    details: socialImpact
      ? 'Présence de tontines ou micro-entreprises à impact social'
      : 'Aucun investissement à impact social direct',
    affectedAssets: assetsPresent(allocations, 'tontine', 'micro_enterprise'),
    remediation: 'Envisager des tontines ou du micro-crédit pour l\'impact social',
  });

  // 4. Governance — no single position > 35%
  const maxPosition = allocations.reduce((max, a) => Math.max(max, a.weight), 0);
  const overweightAssets = allocations.filter((a) => a.weight > 35).map((a) => a.product.name);
  rules.push({
    id: 'esg_governance',
    framework: 'esg',
    rule: 'Gouvernance & diversification (aucune position >35%)',
    status: maxPosition > 35 ? 'warning' : 'compliant',
    details:
      maxPosition > 35
        ? `Position max: ${maxPosition.toFixed(0)}% (seuil: 35%)`
        : `Position max: ${maxPosition.toFixed(0)}%, conforme`,
    affectedAssets: overweightAssets,
    remediation: 'Rééquilibrer pour qu\'aucune position ne dépasse 35%',
  });

  return buildFrameworkResult(
    'esg',
    'Critères ESG',
    'Évaluation environnementale, sociale et de gouvernance',
    rules,
  );
}

// ─── Framework: PRUDENTIAL ───

function evaluatePrudential(allocations: AllocationRecommendation[]): FrameworkResult {
  const rules: ComplianceRule[] = [];

  // 1. Concentration limit — no single asset > 40%
  const maxWeight = allocations.reduce((max, a) => Math.max(max, a.weight), 0);
  const concentrated = allocations.filter((a) => a.weight > 40).map((a) => a.product.name);
  rules.push({
    id: 'prud_concentration',
    framework: 'prudential',
    rule: 'Limite de concentration (<40% par classe)',
    status: maxWeight > 40 ? 'violation' : 'compliant',
    details:
      maxWeight > 40
        ? `Concentration max: ${maxWeight.toFixed(0)}% (limite: 40%)`
        : `Concentration max: ${maxWeight.toFixed(0)}%, conforme`,
    affectedAssets: concentrated,
    remediation: 'Diversifier pour réduire la concentration sous 40%',
  });

  // 2. Minimum diversification — at least 4 classes
  const numClasses = distinctAssetClasses(allocations);
  rules.push({
    id: 'prud_diversification',
    framework: 'prudential',
    rule: 'Diversification minimale (≥4 classes)',
    status: numClasses < 4 ? 'warning' : 'compliant',
    details:
      numClasses < 4
        ? `Seulement ${numClasses} classe(s) (recommandé: ≥4)`
        : `${numClasses} classes d'actifs, bien diversifié`,
    affectedAssets: [],
    remediation: 'Ajouter des classes d\'actifs pour atteindre au moins 4',
  });

  // 3. Max risk exposure — crypto + local_stocks + micro_enterprise <= 50%
  const riskAssets: AssetClass[] = ['crypto', 'local_stocks', 'micro_enterprise'];
  const riskWeight = weightOf(allocations, ...riskAssets);
  rules.push({
    id: 'prud_risk_exposure',
    framework: 'prudential',
    rule: 'Exposition risque maximale (<50%)',
    status: riskWeight > 50 ? 'warning' : 'compliant',
    details:
      riskWeight > 50
        ? `Actifs risqués: ${riskWeight.toFixed(0)}% (seuil: 50%)`
        : `Actifs risqués: ${riskWeight.toFixed(0)}%, dans les limites`,
    affectedAssets: assetsPresent(allocations, ...riskAssets),
    remediation: 'Réduire les actifs à haut risque sous 50% du portefeuille',
  });

  // 4. Counterparty spread — at least 3 distinct asset types
  const distinctTypes = new Set(allocations.map((a) => a.product.asset)).size;
  rules.push({
    id: 'prud_counterparty',
    framework: 'prudential',
    rule: 'Répartition contrepartie (≥3 types)',
    status: distinctTypes < 3 ? 'violation' : 'compliant',
    details:
      distinctTypes < 3
        ? `Seulement ${distinctTypes} type(s) de contrepartie (minimum: 3)`
        : `${distinctTypes} types de contreparties, conforme`,
    affectedAssets: [],
    remediation: 'Ajouter des produits de types différents pour diversifier le risque',
  });

  return buildFrameworkResult(
    'prudential',
    'Règles Prudentielles',
    'Règles de gestion prudentielle et de diversification',
    rules,
  );
}

// ─── Framework: LIQUIDITY ───

function evaluateLiquidity(allocations: AllocationRecommendation[]): FrameworkResult {
  const rules: ComplianceRule[] = [];

  // 1. Emergency buffer — savings + money_market + term_deposit >= 10%
  const liquidAssets: AssetClass[] = ['savings_account', 'money_market', 'term_deposit'];
  const liquidBuffer = weightOf(allocations, ...liquidAssets);
  rules.push({
    id: 'liq_emergency',
    framework: 'liquidity',
    rule: 'Coussin d\'urgence (≥10% liquide)',
    status: liquidBuffer < 10 ? 'warning' : 'compliant',
    details:
      liquidBuffer < 10
        ? `Tampon liquide: ${liquidBuffer.toFixed(0)}% (recommandé: ≥10%)`
        : `Tampon liquide: ${liquidBuffer.toFixed(0)}%, suffisant`,
    affectedAssets: assetsPresent(allocations, ...liquidAssets),
    remediation: 'Augmenter la part d\'épargne ou monétaire à au moins 10%',
  });

  // 2. Illiquid limit — real_estate + tontine + micro_enterprise <= 40%
  const illiquidAssets: AssetClass[] = ['real_estate_fund', 'tontine', 'micro_enterprise'];
  const illiquidWeight = weightOf(allocations, ...illiquidAssets);
  rules.push({
    id: 'liq_illiquid',
    framework: 'liquidity',
    rule: 'Limite d\'actifs illiquides (<40%)',
    status: illiquidWeight > 40 ? 'warning' : 'compliant',
    details:
      illiquidWeight > 40
        ? `Actifs illiquides: ${illiquidWeight.toFixed(0)}% (seuil: 40%)`
        : `Actifs illiquides: ${illiquidWeight.toFixed(0)}%, conforme`,
    affectedAssets: assetsPresent(allocations, ...illiquidAssets),
    remediation: 'Rééquilibrer vers des actifs plus liquides',
  });

  // 3. Redemption access — daily-redeemable >= 30%
  const dailyRedeemable = allocations
    .filter((a) => a.product.liquidity === 'immediate' || a.product.liquidity === 'days')
    .reduce((sum, a) => sum + a.weight, 0);
  const dailyAssets = allocations
    .filter((a) => a.product.liquidity === 'immediate' || a.product.liquidity === 'days')
    .map((a) => a.product.name);
  rules.push({
    id: 'liq_redemption',
    framework: 'liquidity',
    rule: 'Accès rachat rapide (≥30% quotidien)',
    status: dailyRedeemable < 30 ? 'warning' : 'compliant',
    details:
      dailyRedeemable < 30
        ? `Rachat rapide: ${dailyRedeemable.toFixed(0)}% (recommandé: ≥30%)`
        : `Rachat rapide: ${dailyRedeemable.toFixed(0)}%, conforme`,
    affectedAssets: dailyAssets,
    remediation: 'Augmenter la part d\'actifs à rachat immédiat ou sous quelques jours',
  });

  return buildFrameworkResult(
    'liquidity',
    'Exigences de Liquidité',
    'Vérification des exigences de liquidité et d\'accès aux fonds',
    rules,
  );
}

// ─── Build a FrameworkResult ───

function buildFrameworkResult(
  framework: ComplianceFramework,
  label: string,
  description: string,
  rules: ComplianceRule[],
): FrameworkResult {
  const violationCount = rules.filter((r) => r.status === 'violation').length;
  const warningCount = rules.filter((r) => r.status === 'warning').length;
  const compliantCount = rules.filter((r) => r.status === 'compliant').length;

  let score = 100;
  score -= violationCount * 25;
  score -= warningCount * 10;
  score = Math.max(0, score);

  let summary: string;
  if (violationCount === 0 && warningCount === 0) {
    summary = `${label} : conforme sur toutes les règles.`;
  } else if (violationCount === 0) {
    summary = `${label} : ${warningCount} avertissement${warningCount > 1 ? 's' : ''}.`;
  } else {
    summary = `${label} : ${violationCount} violation${violationCount > 1 ? 's' : ''}, ${warningCount} avertissement${warningCount > 1 ? 's' : ''}.`;
  }

  return {
    framework,
    label,
    description,
    score,
    grade: scoreToGrade(score),
    rules,
    compliantCount,
    warningCount,
    violationCount,
    summary,
  };
}

// ─── Main Export ───

export function scanCompliance(allocations: AllocationRecommendation[]): ComplianceAnalysis {
  const frameworks = [
    evaluateSharia(allocations),
    evaluateESG(allocations),
    evaluatePrudential(allocations),
    evaluateLiquidity(allocations),
  ];

  const globalScore =
    frameworks.length > 0
      ? Math.round(frameworks.reduce((sum, f) => sum + f.score, 0) / frameworks.length)
      : 100;

  const criticalViolations = frameworks.flatMap((f) =>
    f.rules.filter((r) => r.status === 'violation'),
  );

  // Top actions: violations first, then warnings, deduplicated, max 5
  const seen = new Set<string>();
  const topActions: string[] = [];
  const allRules = frameworks.flatMap((f) => f.rules);
  const sorted = [
    ...allRules.filter((r) => r.status === 'violation'),
    ...allRules.filter((r) => r.status === 'warning'),
  ];
  for (const rule of sorted) {
    if (rule.remediation && !seen.has(rule.remediation)) {
      seen.add(rule.remediation);
      topActions.push(rule.remediation);
      if (topActions.length >= 5) break;
    }
  }

  const totalViolations = frameworks.reduce((sum, f) => sum + f.violationCount, 0);
  const totalWarnings = frameworks.reduce((sum, f) => sum + f.warningCount, 0);

  // Summary in French
  let summary: string;
  if (totalViolations === 0 && totalWarnings === 0) {
    summary = 'Votre portefeuille est conforme sur tous les cadres réglementaires analysés.';
  } else if (totalViolations === 0) {
    summary = `Aucune violation détectée, mais ${totalWarnings} avertissement${totalWarnings > 1 ? 's' : ''} à surveiller.`;
  } else {
    summary = `${totalViolations} violation${totalViolations > 1 ? 's' : ''} critique${totalViolations > 1 ? 's' : ''} et ${totalWarnings} avertissement${totalWarnings > 1 ? 's' : ''} détectés. Actions correctives recommandées.`;
  }

  return {
    frameworks,
    globalScore,
    globalGrade: scoreToGrade(globalScore),
    criticalViolations,
    summary,
    topActions,
  };
}
