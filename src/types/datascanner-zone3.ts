// ============================================
// ZONE 3 - RISK DATA TYPES
// Données de risque PRL/UL : totalUL, yearsOfCollection, 6 catégories
// ============================================

export interface RiskCategoryValue {
  value: number
  confidence: number
}

export interface Zone3ExtractedRiskData {
  totalUL: number
  yearsOfCollection: number
  riskCategories: {
    operationalRisk: RiskCategoryValue
    creditRisk: RiskCategoryValue
    marketRisk: RiskCategoryValue
    liquidityRisk: RiskCategoryValue
    reputationalRisk: RiskCategoryValue
    strategicRisk: RiskCategoryValue
  }
  confidence: number
}

export interface Zone3ValidatedRiskData {
  totalUL: number
  yearsOfCollection: number
  riskCategories: {
    operationalRisk: number
    creditRisk: number
    marketRisk: number
    liquidityRisk: number
    reputationalRisk: number
    strategicRisk: number
  }
}
