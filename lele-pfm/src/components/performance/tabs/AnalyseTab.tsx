import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BarChart3, PieChart, Layers, ShieldAlert, Gauge } from 'lucide-react-native';

import { CollapsibleSection, PF } from '../shared';
import { SectionA_KPIs } from '../SectionA_KPIs';
import { SectionC_VaRDistribution } from '../SectionC_VaRDistribution';
import { SectionD_EconomicBreakdown } from '../SectionD_EconomicBreakdown';
import { SectionE_RiskThresholds } from '../SectionE_RiskThresholds';
import { SectionG_DrivingDashboard } from '../SectionG_DrivingDashboard';
import type { PerformanceData } from '../../../hooks/usePerformanceData';
import type { ViewMode } from '../../../stores/app.store';

interface AnalyseTabProps {
  data: PerformanceData;
  showSection: (visibility: ViewMode[]) => boolean;
}

export function AnalyseTab({ data, showSection }: AnalyseTabProps) {
  const { t } = useTranslation('app');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {/* KPIs (expert + investor) */}
      {showSection(['expert', 'investor']) && (
        <CollapsibleSection
          title={t('performance.sections.keyFigures')}
          icon={BarChart3}
          iconColor={PF.green}
        >
          <SectionA_KPIs kpis={data.kpis} />
        </CollapsibleSection>
      )}

      {/* Economic Breakdown (all modes) */}
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

      {/* VaR Distribution (expert) */}
      {showSection(['expert']) && (
        <CollapsibleSection
          title={t('performance.sections.understandCosts')}
          icon={PieChart}
          iconColor={PF.yellow}
        >
          <SectionC_VaRDistribution data={data.varDistribution} />
        </CollapsibleSection>
      )}

      {/* Risk Thresholds (expert + investor) */}
      {showSection(['expert', 'investor']) && (
        <CollapsibleSection
          title={t('performance.sections.cashbackByCategory')}
          icon={ShieldAlert}
          iconColor={PF.orange}
        >
          <SectionE_RiskThresholds categories={data.categories} />
        </CollapsibleSection>
      )}

      {/* Driving Dashboard (all modes) */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 8,
  },
});
