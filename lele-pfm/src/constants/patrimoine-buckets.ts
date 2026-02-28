import {
  TrendingUp,
  Shield,
  Home,
  Sparkles,
  PiggyBank,
  BookOpen,
  Building2,
  Briefcase,
  Landmark,
  Banknote,
  Gem,
  Coins,
  Crown,
  FileText,
  Clock,
  HeartPulse,
  LucideIcon,
} from 'lucide-react-native';

// ─── Patrimoine Buckets (Règle 20/10/60/10) ───

export type PatrimoineBucket = 'croissance' | 'stabilite' | 'essentiels' | 'plaisir';

export interface BucketConfig {
  code: PatrimoineBucket;
  labelKey: string;
  targetPercent: number;
  color: string;
  icon: LucideIcon;
}

export const PATRIMOINE_BUCKETS: Record<PatrimoineBucket, BucketConfig> = {
  croissance: {
    code: 'croissance',
    labelKey: 'patrimoine.buckets.croissance',
    targetPercent: 20,
    color: '#4ADE80',
    icon: TrendingUp,
  },
  stabilite: {
    code: 'stabilite',
    labelKey: 'patrimoine.buckets.stabilite',
    targetPercent: 10,
    color: '#60A5FA',
    icon: Shield,
  },
  essentiels: {
    code: 'essentiels',
    labelKey: 'patrimoine.buckets.essentiels',
    targetPercent: 60,
    color: '#FBBF24',
    icon: Home,
  },
  plaisir: {
    code: 'plaisir',
    labelKey: 'patrimoine.buckets.plaisir',
    targetPercent: 10,
    color: '#A78BFA',
    icon: Sparkles,
  },
};

// COICOP → bucket mapping
export const COICOP_TO_BUCKET: Record<string, PatrimoineBucket> = {
  '01': 'essentiels', // Alimentation
  '03': 'essentiels', // Transports
  '04': 'essentiels', // Logement → reclassified per COICOP
  '05': 'essentiels', // Habillement
  '06': 'essentiels', // Communications
  '08': 'essentiels', // Education
  '02': 'plaisir',    // Loisirs
  '07': 'plaisir',    // Santé discrétionnaire
};

// ─── Emergency Fund ───

export const EMERGENCY_FUND_MONTHS = 6;
export const LIBERTY_OBJECTIVE_MULTIPLIER = 50;

// ─── Asset Classes ───

export type AssetClass =
  | 'epargne_securisee'
  | 'investissements'
  | 'formation'
  | 'immobilier'
  | 'business'
  | 'obligations'
  | 'matieres_premieres'
  | 'crypto'
  | 'collectibles'
  | 'propriete_intellectuelle'
  | 'retraite'
  | 'assurance_vie';

export interface AssetClassConfig {
  code: AssetClass;
  labelKey: string;
  icon: LucideIcon;
  color: string;
  defaultYield: number;
}

export const ASSET_CLASSES: Record<AssetClass, AssetClassConfig> = {
  epargne_securisee: {
    code: 'epargne_securisee',
    labelKey: 'patrimoine.assets.classes.epargne_securisee',
    icon: PiggyBank,
    color: '#60A5FA',
    defaultYield: 3,
  },
  investissements: {
    code: 'investissements',
    labelKey: 'patrimoine.assets.classes.investissements',
    icon: Landmark,
    color: '#4ADE80',
    defaultYield: 8,
  },
  formation: {
    code: 'formation',
    labelKey: 'patrimoine.assets.classes.formation',
    icon: BookOpen,
    color: '#FBBF24',
    defaultYield: 0,
  },
  immobilier: {
    code: 'immobilier',
    labelKey: 'patrimoine.assets.classes.immobilier',
    icon: Building2,
    color: '#A78BFA',
    defaultYield: 5,
  },
  business: {
    code: 'business',
    labelKey: 'patrimoine.assets.classes.business',
    icon: Briefcase,
    color: '#FB923C',
    defaultYield: 12,
  },
  obligations: {
    code: 'obligations',
    labelKey: 'patrimoine.assets.classes.obligations',
    icon: Banknote,
    color: '#38BDF8',
    defaultYield: 4,
  },
  matieres_premieres: {
    code: 'matieres_premieres',
    labelKey: 'patrimoine.assets.classes.matieres_premieres',
    icon: Gem,
    color: '#F59E0B',
    defaultYield: 5,
  },
  crypto: {
    code: 'crypto',
    labelKey: 'patrimoine.assets.classes.crypto',
    icon: Coins,
    color: '#8B5CF6',
    defaultYield: 0,
  },
  collectibles: {
    code: 'collectibles',
    labelKey: 'patrimoine.assets.classes.collectibles',
    icon: Crown,
    color: '#EC4899',
    defaultYield: 3,
  },
  propriete_intellectuelle: {
    code: 'propriete_intellectuelle',
    labelKey: 'patrimoine.assets.classes.propriete_intellectuelle',
    icon: FileText,
    color: '#14B8A6',
    defaultYield: 8,
  },
  retraite: {
    code: 'retraite',
    labelKey: 'patrimoine.assets.classes.retraite',
    icon: Clock,
    color: '#6366F1',
    defaultYield: 4,
  },
  assurance_vie: {
    code: 'assurance_vie',
    labelKey: 'patrimoine.assets.classes.assurance_vie',
    icon: HeartPulse,
    color: '#F43F5E',
    defaultYield: 3,
  },
};

export const ASSET_CLASS_CODES: AssetClass[] = [
  'epargne_securisee',
  'investissements',
  'obligations',
  'immobilier',
  'business',
  'matieres_premieres',
  'crypto',
  'collectibles',
  'propriete_intellectuelle',
  'formation',
  'retraite',
  'assurance_vie',
];

// ─── Asset Subcategories ───

export interface SubcategoryConfig {
  code: string;
  labelKey: string;
  defaultYield: number;
}

export const ASSET_SUBCATEGORIES: Record<AssetClass, SubcategoryConfig[]> = {
  epargne_securisee: [
    { code: 'livret_a', labelKey: 'patrimoine.sub.livret_a', defaultYield: 3 },
    { code: 'compte_epargne', labelKey: 'patrimoine.sub.compte_epargne', defaultYield: 2 },
    { code: 'depot_terme', labelKey: 'patrimoine.sub.depot_terme', defaultYield: 4 },
    { code: 'certificat_depot', labelKey: 'patrimoine.sub.certificat_depot', defaultYield: 4.5 },
    { code: 'money_market', labelKey: 'patrimoine.sub.money_market', defaultYield: 4 },
    { code: 'tresorerie_mobile', labelKey: 'patrimoine.sub.tresorerie_mobile', defaultYield: 3 },
    { code: 'tontine', labelKey: 'patrimoine.sub.tontine', defaultYield: 5 },
    { code: 'autre_epargne', labelKey: 'patrimoine.sub.autre_epargne', defaultYield: 3 },
  ],
  investissements: [
    { code: 'actions_bourse', labelKey: 'patrimoine.sub.actions_bourse', defaultYield: 8 },
    { code: 'etf_indices', labelKey: 'patrimoine.sub.etf_indices', defaultYield: 7 },
    { code: 'opcvm_fonds', labelKey: 'patrimoine.sub.opcvm_fonds', defaultYield: 6 },
    { code: 'private_equity', labelKey: 'patrimoine.sub.private_equity', defaultYield: 15 },
    { code: 'crowdfunding', labelKey: 'patrimoine.sub.crowdfunding', defaultYield: 8 },
    { code: 'brvm', labelKey: 'patrimoine.sub.brvm', defaultYield: 10 },
    { code: 'autre_invest', labelKey: 'patrimoine.sub.autre_invest', defaultYield: 8 },
  ],
  obligations: [
    { code: 'obligations_etat', labelKey: 'patrimoine.sub.obligations_etat', defaultYield: 4 },
    { code: 'obligations_corpo', labelKey: 'patrimoine.sub.obligations_corpo', defaultYield: 5 },
    { code: 'bons_tresor', labelKey: 'patrimoine.sub.bons_tresor', defaultYield: 3.5 },
    { code: 'sukuk', labelKey: 'patrimoine.sub.sukuk', defaultYield: 4 },
    { code: 'obligations_municipales', labelKey: 'patrimoine.sub.obligations_municipales', defaultYield: 3.5 },
    { code: 'autre_obligation', labelKey: 'patrimoine.sub.autre_obligation', defaultYield: 4 },
  ],
  immobilier: [
    { code: 'residence_principale', labelKey: 'patrimoine.sub.residence_principale', defaultYield: 3 },
    { code: 'locatif_residentiel', labelKey: 'patrimoine.sub.locatif_residentiel', defaultYield: 5 },
    { code: 'locatif_commercial', labelKey: 'patrimoine.sub.locatif_commercial', defaultYield: 7 },
    { code: 'terrain', labelKey: 'patrimoine.sub.terrain', defaultYield: 8 },
    { code: 'scpi_reit', labelKey: 'patrimoine.sub.scpi_reit', defaultYield: 5 },
    { code: 'crowdfunding_immo', labelKey: 'patrimoine.sub.crowdfunding_immo', defaultYield: 8 },
    { code: 'autre_immo', labelKey: 'patrimoine.sub.autre_immo', defaultYield: 5 },
  ],
  business: [
    { code: 'entreprise_propre', labelKey: 'patrimoine.sub.entreprise_propre', defaultYield: 15 },
    { code: 'franchise', labelKey: 'patrimoine.sub.franchise', defaultYield: 12 },
    { code: 'parts_societe', labelKey: 'patrimoine.sub.parts_societe', defaultYield: 10 },
    { code: 'commerce_en_ligne', labelKey: 'patrimoine.sub.commerce_en_ligne', defaultYield: 20 },
    { code: 'agriculture', labelKey: 'patrimoine.sub.agriculture', defaultYield: 8 },
    { code: 'autre_business', labelKey: 'patrimoine.sub.autre_business', defaultYield: 12 },
  ],
  matieres_premieres: [
    { code: 'or', labelKey: 'patrimoine.sub.or', defaultYield: 5 },
    { code: 'argent_metal', labelKey: 'patrimoine.sub.argent_metal', defaultYield: 4 },
    { code: 'diamants', labelKey: 'patrimoine.sub.diamants', defaultYield: 3 },
    { code: 'petrole_gaz', labelKey: 'patrimoine.sub.petrole_gaz', defaultYield: 6 },
    { code: 'produits_agricoles', labelKey: 'patrimoine.sub.produits_agricoles', defaultYield: 5 },
    { code: 'autre_matiere', labelKey: 'patrimoine.sub.autre_matiere', defaultYield: 5 },
  ],
  crypto: [
    { code: 'bitcoin', labelKey: 'patrimoine.sub.bitcoin', defaultYield: 0 },
    { code: 'ethereum', labelKey: 'patrimoine.sub.ethereum', defaultYield: 4 },
    { code: 'stablecoins', labelKey: 'patrimoine.sub.stablecoins', defaultYield: 5 },
    { code: 'altcoins', labelKey: 'patrimoine.sub.altcoins', defaultYield: 0 },
    { code: 'defi_staking', labelKey: 'patrimoine.sub.defi_staking', defaultYield: 8 },
    { code: 'nft', labelKey: 'patrimoine.sub.nft', defaultYield: 0 },
    { code: 'autre_crypto', labelKey: 'patrimoine.sub.autre_crypto', defaultYield: 0 },
  ],
  collectibles: [
    { code: 'art', labelKey: 'patrimoine.sub.art', defaultYield: 5 },
    { code: 'montres_bijoux', labelKey: 'patrimoine.sub.montres_bijoux', defaultYield: 3 },
    { code: 'vin_spiritueux', labelKey: 'patrimoine.sub.vin_spiritueux', defaultYield: 8 },
    { code: 'voitures_collection', labelKey: 'patrimoine.sub.voitures_collection', defaultYield: 6 },
    { code: 'timbres_monnaies', labelKey: 'patrimoine.sub.timbres_monnaies', defaultYield: 3 },
    { code: 'autre_collectible', labelKey: 'patrimoine.sub.autre_collectible', defaultYield: 3 },
  ],
  propriete_intellectuelle: [
    { code: 'brevets', labelKey: 'patrimoine.sub.brevets', defaultYield: 10 },
    { code: 'droits_auteur', labelKey: 'patrimoine.sub.droits_auteur', defaultYield: 8 },
    { code: 'licences', labelKey: 'patrimoine.sub.licences', defaultYield: 12 },
    { code: 'marques', labelKey: 'patrimoine.sub.marques', defaultYield: 8 },
    { code: 'royalties', labelKey: 'patrimoine.sub.royalties', defaultYield: 10 },
    { code: 'autre_pi', labelKey: 'patrimoine.sub.autre_pi', defaultYield: 8 },
  ],
  formation: [
    { code: 'diplome_certif', labelKey: 'patrimoine.sub.diplome_certif', defaultYield: 0 },
    { code: 'formation_pro', labelKey: 'patrimoine.sub.formation_pro', defaultYield: 0 },
    { code: 'coaching', labelKey: 'patrimoine.sub.coaching', defaultYield: 0 },
    { code: 'autre_formation', labelKey: 'patrimoine.sub.autre_formation', defaultYield: 0 },
  ],
  retraite: [
    { code: 'pension_etat', labelKey: 'patrimoine.sub.pension_etat', defaultYield: 3 },
    { code: 'plan_entreprise', labelKey: 'patrimoine.sub.plan_entreprise', defaultYield: 5 },
    { code: 'per_individuel', labelKey: 'patrimoine.sub.per_individuel', defaultYield: 4 },
    { code: 'caisse_prevoyance', labelKey: 'patrimoine.sub.caisse_prevoyance', defaultYield: 3 },
    { code: 'autre_retraite', labelKey: 'patrimoine.sub.autre_retraite', defaultYield: 4 },
  ],
  assurance_vie: [
    { code: 'fonds_euros', labelKey: 'patrimoine.sub.fonds_euros', defaultYield: 2.5 },
    { code: 'unite_compte', labelKey: 'patrimoine.sub.unite_compte', defaultYield: 5 },
    { code: 'assurance_deces', labelKey: 'patrimoine.sub.assurance_deces', defaultYield: 0 },
    { code: 'assurance_mixte', labelKey: 'patrimoine.sub.assurance_mixte', defaultYield: 3 },
    { code: 'autre_assurance', labelKey: 'patrimoine.sub.autre_assurance', defaultYield: 3 },
  ],
};
