/**
 * Emerging Markets Radar Engine — LELE PFM
 *
 * Pure functions to analyze portfolio exposure to emerging market regions.
 */

import { AssetClass, AllocationRecommendation } from '@/types/investment';

// ─── Types ───

export type MarketRegion =
  | 'west_africa'
  | 'east_africa'
  | 'north_africa_mena'
  | 'south_asia'
  | 'southeast_asia'
  | 'latin_america';

export type RegionOutlook = 'bullish' | 'neutral' | 'cautious';

export interface RegionProfile {
  id: MarketRegion;
  name: string;
  emoji: string;
  countries: string;
  gdpGrowth: number;
  inflationRate: number;
  riskScore: number;
  opportunityScore: number;
  topAssets: AssetClass[];
  keyStrengths: string[];
  keyRisks: string[];
  outlook: RegionOutlook;
  outlookText: string;
}

export interface RegionExposure {
  region: RegionProfile;
  portfolioExposure: number;
  relevantAssets: string[];
  alignmentScore: number;
  recommendation: string;
}

export interface EmergingMarketsAnalysis {
  regions: RegionExposure[];
  totalEmergingExposure: number;
  diversificationScore: number;
  topOpportunity: RegionProfile;
  topRisk: RegionProfile;
  summary: string;
  recommendations: string[];
}

// ─── Region Data ───

const REGION_DATA: RegionProfile[] = [
  {
    id: 'west_africa',
    name: 'Afrique de l\'Ouest',
    emoji: '\uD83C\uDF0D',
    countries: 'Nigeria, Ghana, C\u00f4te d\'Ivoire, S\u00e9n\u00e9gal',
    gdpGrowth: 4.2,
    inflationRate: 12,
    riskScore: 65,
    opportunityScore: 72,
    topAssets: ['micro_enterprise', 'tontine', 'local_stocks', 'real_estate_fund'],
    keyStrengths: ['Croissance d\u00e9mographique forte', 'Boom du mobile banking', 'Ressources naturelles abondantes'],
    keyRisks: ['Instabilit\u00e9 politique', 'Inflation \u00e9lev\u00e9e', 'Risque de change'],
    outlook: 'bullish',
    outlookText: 'Fort potentiel de croissance port\u00e9 par la d\u00e9mographie et la digitalisation.',
  },
  {
    id: 'east_africa',
    name: 'Afrique de l\'Est',
    emoji: '\uD83C\uDFD4\uFE0F',
    countries: 'Kenya, \u00c9thiopie, Rwanda, Tanzanie',
    gdpGrowth: 5.5,
    inflationRate: 8,
    riskScore: 55,
    opportunityScore: 78,
    topAssets: ['micro_enterprise', 'local_stocks', 'real_estate_fund', 'tontine'],
    keyStrengths: ['Hub technologique (M-Pesa)', 'Croissance rapide', 'Investissements infrastructure'],
    keyRisks: ['D\u00e9pendance agriculture', 'Risque climatique', 'Volatilit\u00e9 politique'],
    outlook: 'bullish',
    outlookText: 'R\u00e9gion la plus dynamique du continent avec un \u00e9cosyst\u00e8me tech en expansion.',
  },
  {
    id: 'north_africa_mena',
    name: 'Afrique du Nord & MENA',
    emoji: '\uD83D\uDD4C',
    countries: 'Maroc, \u00c9gypte, Tunisie, EAU, Arabie Saoudite',
    gdpGrowth: 3.5,
    inflationRate: 6,
    riskScore: 45,
    opportunityScore: 65,
    topAssets: ['sukuk', 'real_estate_fund', 'government_bonds', 'stock_index'],
    keyStrengths: ['Finance islamique d\u00e9velopp\u00e9e', 'Infrastructures modernes', 'Position g\u00e9ostrat\u00e9gique'],
    keyRisks: ['D\u00e9pendance hydrocarbures', 'Tensions g\u00e9opolitiques', 'Ch\u00f4mage des jeunes'],
    outlook: 'neutral',
    outlookText: 'Potentiel solide avec la diversification post-p\u00e9trole et la finance islamique.',
  },
  {
    id: 'south_asia',
    name: 'Asie du Sud',
    emoji: '\uD83C\uDDEE\uD83C\uDDF3',
    countries: 'Inde, Bangladesh, Sri Lanka, Pakistan',
    gdpGrowth: 6.5,
    inflationRate: 5,
    riskScore: 50,
    opportunityScore: 85,
    topAssets: ['stock_index', 'mutual_fund', 'local_stocks', 'corporate_bonds'],
    keyStrengths: ['Plus grande population active mondiale', 'Boom technologique', 'Classe moyenne en expansion'],
    keyRisks: ['Bureaucratie', 'In\u00e9galit\u00e9s r\u00e9gionales', 'Risque climatique'],
    outlook: 'bullish',
    outlookText: 'L\'Inde est devenue la 3\u00e8me \u00e9conomie mondiale. Potentiel de croissance exceptionnel.',
  },
  {
    id: 'southeast_asia',
    name: 'Asie du Sud-Est',
    emoji: '\uD83C\uDF0F',
    countries: 'Indon\u00e9sie, Vietnam, Tha\u00eflande, Philippines',
    gdpGrowth: 5.0,
    inflationRate: 4,
    riskScore: 40,
    opportunityScore: 75,
    topAssets: ['stock_index', 'real_estate_fund', 'corporate_bonds', 'mutual_fund'],
    keyStrengths: ['Stabilit\u00e9 relative', 'Hub manufacturier mondial', 'Tourisme croissant'],
    keyRisks: ['Concurrence avec la Chine', 'Risque climatique', 'Gouvernance variable'],
    outlook: 'bullish',
    outlookText: 'Zone de croissance stable b\u00e9n\u00e9ficiant du d\u00e9couplage Chine-Occident.',
  },
  {
    id: 'latin_america',
    name: 'Am\u00e9rique Latine',
    emoji: '\uD83C\uDF0E',
    countries: 'Br\u00e9sil, Mexique, Colombie, Chili',
    gdpGrowth: 2.5,
    inflationRate: 7,
    riskScore: 55,
    opportunityScore: 60,
    topAssets: ['local_stocks', 'real_estate_fund', 'government_bonds', 'gold'],
    keyStrengths: ['Ressources naturelles', 'Nearshoring (Mexique)', 'Agriculture exportatrice'],
    keyRisks: ['Instabilit\u00e9 politique', 'Inflation volatile', 'D\u00e9pendance mati\u00e8res premi\u00e8res'],
    outlook: 'neutral',
    outlookText: 'Potentiel s\u00e9lectif. Le Mexique profite du nearshoring, le Br\u00e9sil de ses commodit\u00e9s.',
  },
];

// ─── Asset → Region Mapping ───

const ASSET_REGION_MAP: Partial<Record<AssetClass, MarketRegion[]>> = {
  local_stocks: ['west_africa', 'east_africa', 'north_africa_mena', 'south_asia', 'southeast_asia', 'latin_america'],
  tontine: ['west_africa', 'east_africa'],
  micro_enterprise: ['west_africa', 'east_africa', 'south_asia'],
  sukuk: ['north_africa_mena'],
  real_estate_fund: ['west_africa', 'north_africa_mena', 'southeast_asia', 'latin_america'],
  stock_index: ['south_asia', 'southeast_asia', 'latin_america'],
  mutual_fund: ['south_asia', 'southeast_asia'],
  corporate_bonds: ['south_asia', 'southeast_asia', 'latin_america'],
  government_bonds: ['north_africa_mena', 'latin_america'],
  gold: ['latin_america'],
};
// Assets not in map (savings_account, term_deposit, money_market, crypto) = no specific regional exposure

// ─── Main Analysis ───

export function analyzeEmergingMarkets(
  allocations: AllocationRecommendation[],
): EmergingMarketsAnalysis {
  // Build per-region exposure
  const regionExposureMap = new Map<MarketRegion, number>();
  const regionAssetsMap = new Map<MarketRegion, string[]>();
  for (const region of REGION_DATA) {
    regionExposureMap.set(region.id, 0);
    regionAssetsMap.set(region.id, []);
  }

  for (const alloc of allocations) {
    const regions = ASSET_REGION_MAP[alloc.product.asset];
    if (!regions || regions.length === 0) continue;
    const share = alloc.weight / regions.length;
    for (const regionId of regions) {
      regionExposureMap.set(regionId, (regionExposureMap.get(regionId) ?? 0) + share);
      const assets = regionAssetsMap.get(regionId) ?? [];
      if (!assets.includes(alloc.product.name)) {
        assets.push(alloc.product.name);
        regionAssetsMap.set(regionId, assets);
      }
    }
  }

  // Build user asset set for alignment
  const userAssets = new Set(allocations.map((a) => a.product.asset));

  // Compute per-region details
  const regions: RegionExposure[] = REGION_DATA.map((region) => {
    const exposure = Math.round((regionExposureMap.get(region.id) ?? 0) * 10) / 10;
    const relevantAssets = regionAssetsMap.get(region.id) ?? [];

    // Alignment = overlap between user assets and region topAssets
    const overlap = region.topAssets.filter((a) => userAssets.has(a)).length;
    const alignmentScore = region.topAssets.length > 0
      ? Math.round((overlap / region.topAssets.length) * 100)
      : 0;

    const recommendation = buildRecommendation(region, exposure, alignmentScore);

    return { region, portfolioExposure: exposure, relevantAssets, alignmentScore, recommendation };
  });

  // Total emerging exposure
  const totalEmergingExposure = Math.round(
    Math.min(100, regions.reduce((sum, r) => sum + r.portfolioExposure, 0)) * 10,
  ) / 10;

  // Diversification: how many regions have >5% exposure (max 6 regions, each = 16.6%)
  const regionsAboveThreshold = regions.filter((r) => r.portfolioExposure > 5).length;
  const diversificationScore = Math.min(100, Math.round(regionsAboveThreshold * 16.6));

  // Top opportunity = highest opportunityScore region overall
  const topOpportunity = [...REGION_DATA].sort((a, b) => b.opportunityScore - a.opportunityScore)[0];
  // Top risk = highest riskScore region overall
  const topRisk = [...REGION_DATA].sort((a, b) => b.riskScore - a.riskScore)[0];

  // Summary
  const summary = buildSummary(totalEmergingExposure, diversificationScore, topOpportunity);

  // Recommendations
  const recommendations = buildRecommendations(regions, totalEmergingExposure, diversificationScore);

  return {
    regions,
    totalEmergingExposure,
    diversificationScore,
    topOpportunity,
    topRisk,
    summary,
    recommendations,
  };
}

// ─── Helpers ───

function buildRecommendation(region: RegionProfile, exposure: number, alignment: number): string {
  if (exposure === 0) {
    if (region.opportunityScore >= 75) {
      return `R\u00e9gion \u00e0 fort potentiel (${region.opportunityScore}/100). Envisagez d'y allouer une part via ${region.topAssets.slice(0, 2).join(', ')}.`;
    }
    return `Aucune exposition. Potentiel mod\u00e9r\u00e9 (${region.opportunityScore}/100).`;
  }
  if (exposure < 5) {
    return `Exposition faible (${exposure}%). Alignement ${alignment}%. Consid\u00e9rez un renforcement si votre profil le permet.`;
  }
  if (alignment >= 70) {
    return `Bonne diversification r\u00e9gionale. Alignement fort (${alignment}%) avec les actifs cl\u00e9s de la r\u00e9gion.`;
  }
  return `Exposition correcte (${exposure}%). Optimisez l'alignement en ciblant : ${region.topAssets.slice(0, 2).join(', ')}.`;
}

function buildSummary(
  totalExposure: number,
  diversification: number,
  topOpp: RegionProfile,
): string {
  if (totalExposure === 0) {
    return 'Votre portefeuille n\'a aucune exposition aux march\u00e9s \u00e9mergents. Ces march\u00e9s offrent des rendements potentiels sup\u00e9rieurs en \u00e9change d\'un risque accru.';
  }
  const diversText = diversification >= 50 ? 'bien diversifi\u00e9e' : 'concentr\u00e9e';
  return `Exposition \u00e9mergente de ${totalExposure}%, ${diversText} g\u00e9ographiquement (score ${diversification}/100). La r\u00e9gion la plus prometteuse est ${topOpp.name}.`;
}

function buildRecommendations(
  exposures: RegionExposure[],
  totalExposure: number,
  diversification: number,
): string[] {
  const recs: string[] = [];

  if (totalExposure === 0) {
    recs.push('Commencez par une exposition modeste (5-10%) via des fonds diversifi\u00e9s ou des indices \u00e9mergents.');
    recs.push('Les tontines et micro-entreprises offrent un acc\u00e8s direct aux march\u00e9s africains.');
    recs.push('Les sukuk (obligations islamiques) permettent une exposition MENA \u00e0 risque mod\u00e9r\u00e9.');
    return recs;
  }

  if (diversification < 30) {
    recs.push('Diversifiez votre exposition g\u00e9ographique. Votre portefeuille est concentr\u00e9 sur peu de r\u00e9gions.');
  }

  // Find high-opportunity unexplored regions
  const unexplored = exposures
    .filter((r) => r.portfolioExposure === 0 && r.region.opportunityScore >= 70)
    .sort((a, b) => b.region.opportunityScore - a.region.opportunityScore);

  if (unexplored.length > 0) {
    recs.push(`Explorez ${unexplored[0].region.name} (opportunit\u00e9 ${unexplored[0].region.opportunityScore}/100) pour augmenter votre diversification.`);
  }

  // Find over-exposed high-risk regions
  const highRiskExposed = exposures
    .filter((r) => r.portfolioExposure > 15 && r.region.riskScore >= 60);
  if (highRiskExposed.length > 0) {
    recs.push(`Attention : forte exposition (${highRiskExposed[0].portfolioExposure}%) \u00e0 ${highRiskExposed[0].region.name}, r\u00e9gion \u00e0 risque \u00e9lev\u00e9 (${highRiskExposed[0].region.riskScore}/100).`);
  }

  if (totalExposure > 40) {
    recs.push('Votre exposition \u00e9mergente d\u00e9passe 40%. Consid\u00e9rez un r\u00e9\u00e9quilibrage vers des actifs plus stables.');
  }

  if (recs.length === 0) {
    recs.push('Votre exposition \u00e9mergente est \u00e9quilibr\u00e9e. Continuez \u00e0 surveiller les \u00e9volutions macro\u00e9conomiques r\u00e9gionales.');
  }

  return recs;
}

// ─── Exports for testing / external use ───

export function getRegions(): RegionProfile[] {
  return REGION_DATA;
}

export function getAssetRegionMap(): Partial<Record<AssetClass, MarketRegion[]>> {
  return ASSET_REGION_MAP;
}
