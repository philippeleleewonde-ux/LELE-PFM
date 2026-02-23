import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Target,
  PieChart,
  Layers,
  ShieldAlert,
  PiggyBank,
  Gauge,
  Zap,
  Rocket,
  Trophy,
  Brain,
  Award,
  Star,
  CalendarDays,
  ClipboardCheck,
  Briefcase,
  Shield,
  Calculator,
  Layers3,
  Dices,
  History,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Skull,
  BrainCircuit,
  Receipt,
  Globe,
  Scale,
  MessageCircleQuestion,
  Sparkles,
  Radar,
} from 'lucide-react-native';

import { usePerformanceData } from '../../hooks/usePerformanceData';
import { CollapsibleSection, PF, FadeInView } from '../../components/performance/shared';
import { ScoreHero } from '../../components/performance/ScoreHero';
import { FinancialScoreRing } from '../../components/performance/FinancialScoreRing';
import { usePerformanceStore } from '../../stores/performance-store';
import { FinancialScoreReport } from '../../components/performance/FinancialScoreReport';
import { SectionA_KPIs } from '../../components/performance/SectionA_KPIs';
import { SectionB_TriennialPlan } from '../../components/performance/SectionB_TriennialPlan';
import { SectionC_VaRDistribution } from '../../components/performance/SectionC_VaRDistribution';
import { SectionD_EconomicBreakdown } from '../../components/performance/SectionD_EconomicBreakdown';
import { SectionE_RiskThresholds } from '../../components/performance/SectionE_RiskThresholds';
import { SectionF_SavingsPlan } from '../../components/performance/SectionF_SavingsPlan';
import { SectionG_DrivingDashboard } from '../../components/performance/SectionG_DrivingDashboard';
import { SectionActions } from '../../components/performance/SectionActions';
import { SectionIndicators } from '../../components/performance/SectionIndicators';
import { PerformanceCalendar } from '../../components/reporting/PerformanceCalendar';
import { SectionN_ObjectifVsRealise } from '../../components/performance/SectionN_ObjectifVsRealise';
import { SectionO_InvestmentPortfolio } from '../../components/performance/SectionO_InvestmentPortfolio';
import { SectionP_AllWeather } from '../../components/performance/SectionP_AllWeather';
import { SectionQ_KellyCriterion } from '../../components/performance/SectionQ_KellyCriterion';
import { SectionR_FactorAnalysis } from '../../components/performance/SectionR_FactorAnalysis';
import { SectionS_MonteCarlo } from '../../components/performance/SectionS_MonteCarlo';
import { SectionT_StressTest } from '../../components/performance/SectionT_StressTest';
import { SectionU_MacroScenarios } from '../../components/performance/SectionU_MacroScenarios';
import { SectionV_BehavioralBiases } from '../../components/performance/SectionV_BehavioralBiases';
import { SectionW_PreMortem } from '../../components/performance/SectionW_PreMortem';
import { SectionX_PsychScore } from '../../components/performance/SectionX_PsychScore';
import { SectionY_TaxOptimization } from '../../components/performance/SectionY_TaxOptimization';
import { SectionZ_EmergingMarkets } from '../../components/performance/SectionZ_EmergingMarkets';
import { SectionAA_RegulatoryCompliance } from '../../components/performance/SectionAA_RegulatoryCompliance';
import { SectionAB_SocraticCoach } from '../../components/performance/SectionAB_SocraticCoach';
import { SectionAC_WisdomSynthesis } from '../../components/performance/SectionAC_WisdomSynthesis';
import { useViewMode } from '../../hooks/useViewMode';
import { SectionEvolution } from '../../components/performance/SectionEvolution';

export default function PerformanceScreen() {
  const { t } = useTranslation('app');
  const router = useRouter();
  const data = usePerformanceData();
  const { showSection, isInvestor } = useViewMode();
  const hasWeeklyData = usePerformanceStore((s) => s.records.length > 0);

  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <BarChart3 size={48} color={PF.textMuted} />
          <Text style={styles.emptyTitle}>{t('performance.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('performance.emptyMessage')}</Text>
          <Pressable style={styles.ctaButton} onPress={() => router.push('/setup-wizard')}>
            <Text style={styles.ctaText}>{t('performance.emptyButton')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Spotlights */}
      <View style={styles.spotlights}>
        <View style={[styles.spot, { top: -60, left: -80, backgroundColor: 'rgba(217,161,27,0.08)' }]} />
        <View style={[styles.spot, { top: 300, right: -100, backgroundColor: 'rgba(251,189,35,0.06)' }]} />
        <View style={[styles.spot, { bottom: -40, left: 50, backgroundColor: 'rgba(74,222,128,0.04)' }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Score — Static (wizard) or Dynamic (weekly data) */}
        <FadeInView>
          {hasWeeklyData ? (
            <FinancialScoreRing />
          ) : (
            <ScoreHero score={data.output.globalScore} grade={data.output.grade} />
          )}
        </FadeInView>

        {/* Section: Rapport Score Dynamique (only when weekly data exists) */}
        {hasWeeklyData && (
          <CollapsibleSection
            title={t('performance.sections.financialScore')}
            icon={Radar}
            iconColor={PF.accent}
            defaultOpen
          >
            <FinancialScoreReport />
          </CollapsibleSection>
        )}

        {/* Section: Evolution Hebdomadaire (only when weekly data exists) */}
        {hasWeeklyData && (
          <CollapsibleSection
            title={t('performance.sections.weeklyEvolution')}
            icon={TrendingUp}
            iconColor={PF.green}
          >
            <SectionEvolution />
          </CollapsibleSection>
        )}

        {/* Section: Performance Calendar — Objectif vs Réalisé */}
        <CollapsibleSection
          title={t('performance.sections.performanceCalendar')}
          icon={CalendarDays}
          iconColor={PF.neonCyan}
          defaultOpen
        >
          <PerformanceCalendar />
        </CollapsibleSection>

        {/* Section N - Objectif vs Realise */}
        <CollapsibleSection
          title={t('performance.sections.objectiveVsActual')}
          icon={ClipboardCheck}
          iconColor={PF.green}
          defaultOpen
        >
          <SectionN_ObjectifVsRealise />
        </CollapsibleSection>

        {/* Section A - KPIs (expert + investor) */}
        {showSection(['expert', 'investor']) && (
          <CollapsibleSection
            title={t('performance.sections.keyFigures')}
            icon={BarChart3}
            iconColor={PF.green}
          >
            <SectionA_KPIs kpis={data.kpis} />
          </CollapsibleSection>
        )}

        {/* Section B - Triennial Plan (expert + investor) */}
        {showSection(['expert', 'investor']) && (
          <CollapsibleSection
            title={t('performance.sections.cashback3Years')}
            icon={Target}
            iconColor={PF.cyan}
          >
            <SectionB_TriennialPlan plans={data.triennialPlan} />
          </CollapsibleSection>
        )}

        {/* Section C - VaR Distribution (expert only) */}
        {showSection(['expert']) && (
          <CollapsibleSection
            title={t('performance.sections.understandCosts')}
            icon={PieChart}
            iconColor={PF.yellow}
          >
            <SectionC_VaRDistribution data={data.varDistribution} />
          </CollapsibleSection>
        )}

        {/* Section D - Economic Breakdown (all modes) */}
        <CollapsibleSection
          title={t('performance.sections.whereMoneyGoes')}
          icon={Layers}
          iconColor={PF.blue}
        >
          <SectionD_EconomicBreakdown
            categories={data.categories}
            elRevenue={data.elRevenue}
            elExpense={data.elExpense}
            coherenceRatio={data.coherenceRatio}
          />
        </CollapsibleSection>

        {/* Section E - Risk Thresholds (expert + investor) */}
        {showSection(['expert', 'investor']) && (
          <CollapsibleSection
            title={t('performance.sections.cashbackByCategory')}
            icon={ShieldAlert}
            iconColor={PF.orange}
          >
            <SectionE_RiskThresholds categories={data.categories} />
          </CollapsibleSection>
        )}

        {/* Section F - Savings Plan (expert + investor) */}
        {showSection(['expert', 'investor']) && (
          <CollapsibleSection
            title={t('performance.sections.progressiveCashback')}
            icon={PiggyBank}
            iconColor={PF.violet}
          >
            <SectionF_SavingsPlan
              pob={data.pob}
              inflationAdjusted={data.inflationAdjusted}
              eprN1={data.output.step9.epr_n1}
              eprN2={data.output.step9.epr_n2}
              eprN3={data.output.step9.epr_n3}
              epargneN1={data.output.step9.epargne_n1}
              epargneN2={data.output.step9.epargne_n2}
              epargneN3={data.output.step9.epargne_n3}
              discretionnaireN1={data.output.step9.discretionnaire_n1}
              discretionnaireN2={data.output.step9.discretionnaire_n2}
              discretionnaireN3={data.output.step9.discretionnaire_n3}
              monthlyTargetN1={data.output.step9.monthly_target_n1}
              monthlyTargetN2={data.output.step9.monthly_target_n2}
              monthlyTargetN3={data.output.step9.monthly_target_n3}
            />
          </CollapsibleSection>
        )}

        {/* Section G - Driving Dashboard (all modes) */}
        <CollapsibleSection
          title={t('performance.sections.concreteGoals')}
          icon={Gauge}
          iconColor={PF.accent}
        >
          <SectionG_DrivingDashboard
            eprN1={data.eprByYear.n1}
            eprN2={data.eprByYear.n2}
            eprN3={data.eprByYear.n3}
            monthlyTargetN1={data.output.step9.monthly_target_n1}
            monthlyTargetN2={data.output.step9.monthly_target_n2}
            monthlyTargetN3={data.output.step9.monthly_target_n3}
            weeklyTargetN1={data.output.step9.weekly_target_n1}
            weeklyTargetN2={data.output.step9.weekly_target_n2}
            weeklyTargetN3={data.output.step9.weekly_target_n3}
          />
        </CollapsibleSection>

        {/* Section H - Actions An 1 (all modes) */}
        <CollapsibleSection
          title={t('performance.sections.whatToDoThisYear')}
          icon={Zap}
          iconColor={PF.cyan}
        >
          <SectionActions year={1} categories={data.categories} />
        </CollapsibleSection>

        {/* Section I - Actions An 2 (expert + investor) */}
        {showSection(['expert', 'investor']) && (
          <CollapsibleSection
            title={t('performance.sections.whatToDoNextYear')}
            icon={Rocket}
            iconColor={PF.blue}
          >
            <SectionActions year={2} categories={data.categories} />
          </CollapsibleSection>
        )}

        {/* Section J - Actions An 3 (expert + investor) */}
        {showSection(['expert', 'investor']) && (
          <CollapsibleSection
            title={t('performance.sections.whatToDoIn3Years')}
            icon={Trophy}
            iconColor={PF.green}
          >
            <SectionActions year={3} categories={data.categories} />
          </CollapsibleSection>
        )}

        {/* Section K - Défis Indicateurs An 1 (expert + investor) */}
        {showSection(['expert', 'investor']) && data.indicators.length > 0 && (
          <CollapsibleSection
            title={t('performance.sections.challengesYear1')}
            icon={Brain}
            iconColor={PF.accent}
          >
            <SectionIndicators
              year={1}
              indicators={data.indicators}
              eprTotal={data.eprByYear.n1}
            />
          </CollapsibleSection>
        )}

        {/* Section L - Défis Indicateurs An 2 (expert + investor) */}
        {showSection(['expert', 'investor']) && data.indicators.length > 0 && (
          <CollapsibleSection
            title={t('performance.sections.challengesYear2')}
            icon={Award}
            iconColor={PF.violet}
          >
            <SectionIndicators
              year={2}
              indicators={data.indicators}
              eprTotal={data.eprByYear.n2}
            />
          </CollapsibleSection>
        )}

        {/* Section M - Défis Indicateurs An 3 (expert + investor) */}
        {showSection(['expert', 'investor']) && data.indicators.length > 0 && (
          <CollapsibleSection
            title={t('performance.sections.challengesYear3')}
            icon={Star}
            iconColor={PF.gold}
          >
            <SectionIndicators
              year={3}
              indicators={data.indicators}
              eprTotal={data.eprByYear.n3}
            />
          </CollapsibleSection>
        )}

        {/* Section O - Investment Portfolio (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.investmentPortfolio')}
            icon={Briefcase}
            iconColor={PF.yellow}
          >
            <SectionO_InvestmentPortfolio />
          </CollapsibleSection>
        )}

        {/* Section P - All-Weather Analysis (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.allWeatherAnalysis')}
            icon={Shield}
            iconColor={PF.gold}
          >
            <SectionP_AllWeather />
          </CollapsibleSection>
        )}

        {/* Section Q - Kelly Criterion (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.kellySizing')}
            icon={Calculator}
            iconColor={PF.accent}
          >
            <SectionQ_KellyCriterion />
          </CollapsibleSection>
        )}

        {/* Section R - Factor Analysis (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.factorAnalysis')}
            icon={Layers3}
            iconColor={PF.blue}
          >
            <SectionR_FactorAnalysis />
          </CollapsibleSection>
        )}

        {/* Section S - Monte Carlo Simulation (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.monteCarlo')}
            icon={Dices}
            iconColor={PF.violet}
          >
            <SectionS_MonteCarlo />
          </CollapsibleSection>
        )}

        {/* Section T - Historical Stress Test (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.historicalStress')}
            icon={History}
            iconColor={PF.orange}
          >
            <SectionT_StressTest />
          </CollapsibleSection>
        )}

        {/* Section U - Macro Scenarios (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.macroScenarios')}
            icon={TrendingDown}
            iconColor={PF.red}
          >
            <SectionU_MacroScenarios />
          </CollapsibleSection>
        )}

        {/* Section V - Behavioral Biases (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.behavioralAnalysis')}
            icon={ShieldCheck}
            iconColor={PF.cyan}
          >
            <SectionV_BehavioralBiases />
          </CollapsibleSection>
        )}

        {/* Section W - Pre-Mortem Analysis (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.preMortem')}
            icon={Skull}
            iconColor={PF.orange}
          >
            <SectionW_PreMortem />
          </CollapsibleSection>
        )}

        {/* Section X - ACE Psychological Score (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.aceScore')}
            icon={BrainCircuit}
            iconColor={PF.accent}
          >
            <SectionX_PsychScore />
          </CollapsibleSection>
        )}

        {/* Section Y - Tax Optimization (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.taxOptimization')}
            icon={Receipt}
            iconColor={PF.yellow}
          >
            <SectionY_TaxOptimization />
          </CollapsibleSection>
        )}

        {/* Section Z - Emerging Markets Radar (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.emergingMarkets')}
            icon={Globe}
            iconColor={PF.green}
          >
            <SectionZ_EmergingMarkets />
          </CollapsibleSection>
        )}

        {/* Section AA - Regulatory Compliance (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.compliance')}
            icon={Scale}
            iconColor={PF.violet}
          >
            <SectionAA_RegulatoryCompliance />
          </CollapsibleSection>
        )}

        {/* Section AB - Socratic Coach (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.socraticCoach')}
            icon={MessageCircleQuestion}
            iconColor={PF.accent}
          >
            <SectionAB_SocraticCoach />
          </CollapsibleSection>
        )}

        {/* Section AC - Wisdom Synthesis (investor only) */}
        {isInvestor && (
          <CollapsibleSection
            title={t('performance.sections.globalSynthesis')}
            icon={Sparkles}
            iconColor={PF.gold}
            defaultOpen
          >
            <SectionAC_WisdomSynthesis />
          </CollapsibleSection>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PF.darkBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 60,
  },
  spotlights: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  spot: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: PF.darkBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 16,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: PF.cardBg,
  },
  emptyTitle: {
    color: PF.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: PF.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: PF.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  ctaText: {
    color: PF.darkBg,
    fontSize: 14,
    fontWeight: '700',
  },
});
