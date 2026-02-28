import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Target,
  PiggyBank,
  Wallet,
  Zap,
  Rocket,
  Trophy,
  Brain,
  Award,
  Star,
} from 'lucide-react-native';

import { CollapsibleSection, PF } from '../shared';
import { SectionB_TriennialPlan } from '../SectionB_TriennialPlan';
import { SectionF_SavingsPlan } from '../SectionF_SavingsPlan';
import { SectionAD_Patrimoine } from '../SectionAD_Patrimoine';
import { SectionActions } from '../SectionActions';
import { SectionIndicators } from '../SectionIndicators';
import type { PerformanceData } from '../../../hooks/usePerformanceData';
import type { ViewMode } from '../../../stores/app.store';

interface StrategieTabProps {
  data: PerformanceData;
  showSection: (visibility: ViewMode[]) => boolean;
}

export function StrategieTab({ data, showSection }: StrategieTabProps) {
  const { t } = useTranslation('app');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {/* Triennial Plan (expert + investor) */}
      {showSection(['expert', 'investor']) && (
        <CollapsibleSection
          title={t('performance.sections.cashback3Years')}
          icon={Target}
          iconColor={PF.cyan}
        >
          <SectionB_TriennialPlan plans={data.triennialPlan} />
        </CollapsibleSection>
      )}

      {/* Savings Plan (expert + investor) */}
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

      {/* Patrimoine (expert + investor) */}
      {showSection(['expert', 'investor']) && (
        <CollapsibleSection
          title={t('performance.sections.patrimoine')}
          icon={Wallet}
          iconColor={PF.green}
        >
          <SectionAD_Patrimoine />
        </CollapsibleSection>
      )}

      {/* Actions Year 1 (all modes) */}
      <CollapsibleSection
        title={t('performance.sections.whatToDoThisYear')}
        icon={Zap}
        iconColor={PF.cyan}
      >
        <SectionActions year={1} categories={data.categories} />
      </CollapsibleSection>

      {/* Actions Year 2 (expert + investor) */}
      {showSection(['expert', 'investor']) && (
        <CollapsibleSection
          title={t('performance.sections.whatToDoNextYear')}
          icon={Rocket}
          iconColor={PF.blue}
        >
          <SectionActions year={2} categories={data.categories} />
        </CollapsibleSection>
      )}

      {/* Actions Year 3 (expert + investor) */}
      {showSection(['expert', 'investor']) && (
        <CollapsibleSection
          title={t('performance.sections.whatToDoIn3Years')}
          icon={Trophy}
          iconColor={PF.green}
        >
          <SectionActions year={3} categories={data.categories} />
        </CollapsibleSection>
      )}

      {/* Challenges Year 1 (expert + investor) */}
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

      {/* Challenges Year 2 (expert + investor) */}
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

      {/* Challenges Year 3 (expert + investor) */}
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
