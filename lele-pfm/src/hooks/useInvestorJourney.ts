/**
 * useInvestorJourney — LELE PFM
 *
 * Main hook for the investor journey. Orchestrates recommendation,
 * selection, strategy generation, and dashboard state.
 */

import { useMemo, useCallback } from 'react';
import { useJourneyStore } from '@/stores/journey-store';
import { useInvestmentStore } from '@/stores/investment-store';
import { useWizardStore } from '@/stores/wizard-store';
import { useEngineStore } from '@/stores/engine-store';
import { recommendAssets, RecommenderInput } from '@/domain/calculators/asset-recommender';
import { generateStrategies, regenerateProjections, StrategyProfileInput } from '@/domain/calculators/strategy-generator';
import { COUNTRY_RISK_PROFILES } from '@/constants/country-risk-profiles';
import {
  JourneyPhase,
  StrategyId,
  InvestmentDuration,
} from '@/types/investor-journey';

export function useInvestorJourney() {
  const store = useJourneyStore();
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const wizardFormData = useWizardStore((s) => s.formData);
  const country = wizardFormData.country;
  const engineOutput = useEngineStore((s) => s.engineOutput);
  // Compute EKH score from challenge store or default
  const ekhScore = useMemo(() => {
    if (!engineOutput) return 0;
    // Use globalScore as proxy for financial literacy (0-100 → 0-10)
    return Math.round(engineOutput.globalScore / 10) || 5;
  }, [engineOutput]);

  // Country risk profile
  const countryProfile = useMemo(() => {
    return COUNTRY_RISK_PROFILES[country] ?? null;
  }, [country]);

  // Monthly investment budget
  const monthlyBudget = useMemo(() => {
    if (!engineOutput || !investorProfile) return 0;
    const ratio = investorProfile.investmentRatio || 20;
    return (engineOutput.step9?.epr_n1 ?? 0) * ratio / 100 / 12;
  }, [engineOutput, investorProfile]);

  // Capital initial
  const capitalInitial = useMemo(() => {
    return investorProfile?.capitalInitial ?? 0;
  }, [investorProfile]);

  // ─── Actions ───

  const runRecommendation = useCallback(() => {
    if (!investorProfile || !countryProfile) return;

    const input: RecommenderInput = {
      profile: investorProfile,
      countryCode: country,
      ekhScore,
      investmentInfraLevel: countryProfile.investmentInfraLevel,
      currentPillarCounts: { croissance: 0, amortisseur: 0, refuge: 0, base_arriere: 0 },
    };

    const result = recommendAssets(input);
    store.setRecommendedAssets(result.assets);

    // Auto-accept all recommended assets initially
    const accepted = result.assets.map((a) => ({ ...a, status: 'accepted' as const }));
    for (const asset of accepted) {
      store.acceptAsset(asset.id);
    }

    store.setPhase('recommendation');
  }, [investorProfile, countryProfile, country, ekhScore, store]);

  const generateAllStrategies = useCallback((durationMonths?: number) => {
    const accepted = store.selectedAssets.filter(
      (a) => a.status === 'accepted' || a.status === 'custom',
    );
    if (accepted.length === 0) return;

    const duration = durationMonths ?? store.investmentDuration?.months ?? 60;

    // Build profile input for adaptive strategy generation
    const profileInput: StrategyProfileInput = {
      riskProfile: investorProfile?.riskTolerance ?? 'moderate',
      age: parseInt(wizardFormData.age) || 30,
      dependents: parseInt(wizardFormData.dependents) || 0,
      incomeSource: wizardFormData.incomeSource ?? 'formal',
      extendedFamilyObligations: wizardFormData.extendedFamilyObligations ?? false,
      ekhScore,
      globalScore: engineOutput?.globalScore ?? 50,
      investmentInfraLevel: countryProfile?.investmentInfraLevel ?? 2,
      currencyVolatility: countryProfile?.currencyVolatility ?? 'medium',
      countryCode: country,
      horizon: investorProfile?.horizon ?? 'medium',
    };

    const strategies = generateStrategies({
      selectedAssets: accepted,
      capitalInitial,
      monthlyContribution: monthlyBudget,
      durationMonths: duration,
      profile: profileInput,
    });

    store.setActiveStrategies(strategies);
  }, [store, capitalInitial, monthlyBudget, investorProfile, wizardFormData, ekhScore, engineOutput, countryProfile, country]);

  const updateDuration = useCallback((months: number) => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + months);

    const duration: InvestmentDuration = {
      months,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
    };

    store.setDuration(duration);

    // Regenerate projections with new duration
    if (store.activeStrategies.length > 0) {
      const updated = store.activeStrategies.map((s) =>
        regenerateProjections(s, capitalInitial, monthlyBudget, months),
      );
      store.setActiveStrategies(updated);
    }
  }, [store, capitalInitial, monthlyBudget]);

  const launchJourney = useCallback((strategyId: StrategyId) => {
    store.chooseStrategy(strategyId);
    store.startJourney();
    store.setPhase('accompaniment');
  }, [store]);

  const goToPhase = useCallback((phase: JourneyPhase) => {
    store.setPhase(phase);
  }, [store]);

  // ─── Derived State ───

  const acceptedAssets = useMemo(() => {
    return store.selectedAssets.filter(
      (a) => a.status === 'accepted' || a.status === 'custom',
    );
  }, [store.selectedAssets]);

  const chosenStrategy = useMemo(() => {
    if (!store.chosenStrategyId) return null;
    return store.activeStrategies.find((s) => s.id === store.chosenStrategyId) ?? null;
  }, [store.chosenStrategyId, store.activeStrategies]);

  const isJourneyActive = !!store.journeyStartedAt;

  const canProceedToSelection = store.recommendedAssets.length > 0;
  const canProceedToScenarios = acceptedAssets.length > 0;
  const canProceedToDuration = store.activeStrategies.length > 0;
  const canLaunch = store.chosenStrategyId !== null && store.investmentDuration !== null;

  return {
    // State
    currentPhase: store.currentPhase,
    recommendedAssets: store.recommendedAssets,
    selectedAssets: store.selectedAssets,
    acceptedAssets,
    activeStrategies: store.activeStrategies,
    chosenStrategy,
    chosenStrategyId: store.chosenStrategyId,
    investmentDuration: store.investmentDuration,
    rendezVousConfig: store.rendezVousConfig,
    checkIns: store.checkIns,
    advisoryMessages: store.advisoryMessages,
    procedureProgress: store.procedureProgress,
    investedAmounts: store.investedAmounts,
    isJourneyActive,
    journeyStartedAt: store.journeyStartedAt,

    // Computed
    monthlyBudget,
    capitalInitial,
    countryProfile,
    ekhScore,
    canProceedToSelection,
    canProceedToScenarios,
    canProceedToDuration,
    canLaunch,

    // Actions
    runRecommendation,
    generateAllStrategies,
    updateDuration,
    launchJourney,
    goToPhase,
    acceptAsset: store.acceptAsset,
    rejectAsset: store.rejectAsset,
    addCustomAsset: store.addCustomAsset,
    removeCustomAsset: store.removeCustomAsset,
    updateAssetAllocation: store.updateAssetAllocation,
    chooseStrategy: store.chooseStrategy,
    setRendezVousConfig: store.setRendezVousConfig,
    addCheckIn: store.addCheckIn,
    toggleStepComplete: store.toggleStepComplete,
    initProcedureProgress: store.initProcedureProgress,
    setInvestedAmount: store.setInvestedAmount,
    dismissAdvisory: store.dismissAdvisory,
    resetJourney: store.resetJourney,
  };
}
