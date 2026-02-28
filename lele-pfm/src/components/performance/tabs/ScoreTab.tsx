import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Radar, TrendingUp, CalendarDays, ClipboardCheck } from 'lucide-react-native';

import { CollapsibleSection, PF, FadeInView } from '../shared';
import { ScoreHero } from '../ScoreHero';
import { FinancialScoreRing } from '../FinancialScoreRing';
import { FinancialScoreReport } from '../FinancialScoreReport';
import { SectionEvolution } from '../SectionEvolution';
import { PerformanceCalendar } from '../../reporting/PerformanceCalendar';
import { SectionN_ObjectifVsRealise } from '../SectionN_ObjectifVsRealise';
import type { PerformanceData } from '../../../hooks/usePerformanceData';

interface ScoreTabProps {
  data: PerformanceData;
  hasWeeklyData: boolean;
}

export function ScoreTab({ data, hasWeeklyData }: ScoreTabProps) {
  const { t } = useTranslation('app');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {/* Hero Score */}
      <FadeInView>
        {hasWeeklyData ? (
          <FinancialScoreRing />
        ) : (
          <ScoreHero score={data.output.globalScore} grade={data.output.grade} />
        )}
      </FadeInView>

      {/* Financial Score Report */}
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

      {/* Weekly Evolution */}
      {hasWeeklyData && (
        <CollapsibleSection
          title={t('performance.sections.weeklyEvolution')}
          icon={TrendingUp}
          iconColor={PF.green}
        >
          <SectionEvolution />
        </CollapsibleSection>
      )}

      {/* Performance Calendar */}
      <CollapsibleSection
        title={t('performance.sections.performanceCalendar')}
        icon={CalendarDays}
        iconColor={PF.neonCyan}
        defaultOpen
      >
        <PerformanceCalendar />
      </CollapsibleSection>

      {/* Objectif vs Realise */}
      <CollapsibleSection
        title={t('performance.sections.objectiveVsActual')}
        icon={ClipboardCheck}
        iconColor={PF.green}
        defaultOpen
      >
        <SectionN_ObjectifVsRealise />
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
