import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { X, TrendingUp, TrendingDown, Award, PiggyBank, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import {
  WeeklySavingsResult,
  PeriodSavingsResult,
  getGradeColor,
  getNoteColor,
} from '@/domain/calculators/weekly-savings-engine';
import { WeekCalendarEntry } from '@/hooks/usePerformanceCalendar';
import { getWeekLabel, getWeekRangeLabel } from '@/utils/week-helpers';
import { useSavingsWallet } from '@/hooks/useSavingsWallet';

// ─── Week Report ───

interface WeekReportProps {
  visible: boolean;
  entry: WeekCalendarEntry | null;
  onClose: () => void;
}

export function WeekReportSheet({ visible, entry, onClose }: WeekReportProps) {
  const { t } = useTranslation('tracking');
  if (!entry) return null;
  const { week, year, budget, target, spent, savings } = entry;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{getWeekRangeLabel(week, year)}</Text>
              <Text style={styles.headerSub}>S{week}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Grade Hero */}
            <View style={styles.gradeHero}>
              <Text style={[styles.gradeText, { color: getGradeColor(savings.grade) }]}>
                {savings.grade}
              </Text>
              <Text style={[styles.noteText, { color: getNoteColor(savings.note) }]}>
                {savings.note}/10
              </Text>
              <Text style={styles.gradeLabel}>
                {savings.budgetRespecte ? t('reporting.budgetRespected') : t('reporting.budgetExceeded')}
              </Text>
            </View>

            {/* Budget vs Réalisé */}
            <GlassCard variant="dark" style={styles.cardSpacing}>
              <Text style={styles.sectionLabel}>{t('reporting.budgetVsActual')}</Text>
              <StatRow icon={Wallet} label={t('reporting.weeklyBudget')} value={formatCurrency(budget)} color="#60A5FA" />
              <StatRow icon={TrendingDown} label={t('reporting.spent')} value={formatCurrency(spent)} color={savings.budgetRespecte ? '#4ADE80' : '#F87171'} />
              <StatRow icon={TrendingUp} label={t('reporting.savingsTarget')} value={formatCurrency(target)} color="#A78BFA" />
              <View style={styles.divider} />
              <StatRow
                icon={savings.economiesCappees > 0 ? PiggyBank : TrendingDown}
                label={savings.economiesCappees > 0 ? t('reporting.validatedSavings') : t('reporting.overspend')}
                value={formatCurrency(savings.economiesCappees > 0 ? savings.economiesCappees : savings.depassement)}
                color={savings.economiesCappees > 0 ? '#4ADE80' : '#F87171'}
                bold
              />
            </GlassCard>

            {/* Distribution */}
            {savings.economiesCappees > 0 && (
              <GlassCard variant="dark" style={styles.cardSpacing}>
                <Text style={styles.sectionLabel}>{t('reporting.savingsDistribution')}</Text>
                <StatRow icon={PiggyBank} label={t('reporting.savingsPocket67')} value={formatCurrency(savings.epargne)} color="#4ADE80" />
                <StatRow icon={Wallet} label={t('reporting.funPocket33')} value={formatCurrency(savings.discretionnaire)} color="#A78BFA" />
              </GlassCard>
            )}

            {/* Execution Rate */}
            <GlassCard variant="dark" style={styles.cardSpacing}>
              <Text style={styles.sectionLabel}>{t('reporting.executionRate')}</Text>
              <View style={styles.barContainer}>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(savings.tauxExecution, 100)}%`,
                        backgroundColor: savings.tauxExecution > 100
                          ? '#F87171'
                          : savings.tauxExecution > 80
                            ? '#FBBF24'
                            : '#4ADE80',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{savings.tauxExecution}%</Text>
              </View>
              <Text style={styles.hint}>
                {savings.tauxExecution <= 80
                  ? t('reporting.executionExcellent')
                  : savings.tauxExecution <= 100
                    ? t('reporting.executionGood')
                    : t('reporting.executionOver', { percent: savings.tauxExecution - 100 })}
              </Text>
            </GlassCard>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Period Report (Month / Year) ───

interface PeriodReportProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  summary: PeriodSavingsResult | null;
  onClose: () => void;
}

export function PeriodReportSheet({ visible, title, subtitle, summary, onClose }: PeriodReportProps) {
  const { t } = useTranslation('tracking');
  const wallet = useSavingsWallet();

  if (!summary) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{title}</Text>
              {subtitle && <Text style={styles.headerSub}>{subtitle}</Text>}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Grade Hero */}
            <View style={styles.gradeHero}>
              <Text style={[styles.gradeText, { color: getGradeColor(summary.gradeMoyen) }]}>
                {summary.gradeMoyen}
              </Text>
              <Text style={[styles.noteText, { color: getNoteColor(summary.noteMoyenne) }]}>
                {summary.noteMoyenne}/10
              </Text>
              <Text style={styles.gradeLabel}>
                {t('reporting.weeksAnalyzed', { count: summary.nbSemaines })}
              </Text>
            </View>

            {/* Summary Stats */}
            <GlassCard variant="dark" style={styles.cardSpacing}>
              <Text style={styles.sectionLabel}>{t('reporting.periodSummary')}</Text>
              <StatRow icon={PiggyBank} label={t('reporting.totalSavings')} value={formatCurrency(summary.totalEconomies)} color="#4ADE80" />
              <StatRow icon={TrendingDown} label={t('reporting.totalOverspend')} value={formatCurrency(summary.totalDepassement)} color="#F87171" />
              <View style={styles.divider} />
              <StatRow
                icon={Award}
                label={t('reporting.netSavings')}
                value={formatCurrency(summary.economiesNettes)}
                color={summary.economiesNettes >= 0 ? '#4ADE80' : '#F87171'}
                bold
              />
            </GlassCard>

            {/* Distribution */}
            {summary.totalEconomies > 0 && (
              <GlassCard variant="dark" style={styles.cardSpacing}>
                <Text style={styles.sectionLabel}>{t('reporting.savingsDistributionPeriod')}</Text>
                <StatRow icon={PiggyBank} label={t('reporting.savingsPocket67')} value={formatCurrency(summary.totalEpargne)} color="#4ADE80" />
                <StatRow icon={Wallet} label={t('reporting.funPocket33')} value={formatCurrency(summary.totalDiscretionnaire)} color="#A78BFA" />
              </GlassCard>
            )}

            {/* Budget Respect */}
            <GlassCard variant="dark" style={styles.cardSpacing}>
              <Text style={styles.sectionLabel}>{t('reporting.budgetRespect')}</Text>
              <View style={styles.budgetRow}>
                <View style={styles.budgetStat}>
                  <Text style={[styles.budgetNum, { color: '#4ADE80' }]}>{summary.semainesDansBudget}</Text>
                  <Text style={styles.budgetLabel}>{t('reporting.inBudget')}</Text>
                </View>
                <View style={styles.budgetStat}>
                  <Text style={[styles.budgetNum, { color: '#F87171' }]}>{summary.nbSemaines - summary.semainesDansBudget}</Text>
                  <Text style={styles.budgetLabel}>{t('reporting.overBudget')}</Text>
                </View>
                <View style={styles.budgetStat}>
                  <Text style={[styles.budgetNum, { color: '#FBBF24' }]}>{summary.tauxRespectBudget}%</Text>
                  <Text style={styles.budgetLabel}>{t('reporting.respectRate')}</Text>
                </View>
              </View>
            </GlassCard>

            {/* Cumul (all-time) */}
            {wallet.nbSemainesTotal > 0 && (
              <GlassCard variant="dark" style={styles.cardSpacing}>
                <Text style={styles.sectionLabel}>{t('reporting.cumulSinceStart')}</Text>
                <StatRow
                  icon={PiggyBank}
                  label={t('reporting.totalSavings')}
                  value={formatCurrency(wallet.allTimeEconomies)}
                  color="#4ADE80"
                />
                <StatRow
                  icon={TrendingDown}
                  label={t('reporting.totalOverspend')}
                  value={formatCurrency(wallet.allTimeDepassement)}
                  color="#F87171"
                />
                <View style={styles.divider} />
                <StatRow
                  icon={Award}
                  label={t('reporting.cumulNetSavings')}
                  value={formatCurrency(wallet.allTimeNet)}
                  color={wallet.allTimeNet >= 0 ? '#4ADE80' : '#F87171'}
                  bold
                />
                <View style={styles.divider} />
                <StatRow
                  icon={PiggyBank}
                  label={t('reporting.cumulSavings67')}
                  value={formatCurrency(wallet.allTimeEpargne)}
                  color="#4ADE80"
                />
                <StatRow
                  icon={Wallet}
                  label={t('reporting.cumulFun33')}
                  value={formatCurrency(wallet.allTimeDiscretionnaire)}
                  color="#A78BFA"
                />
              </GlassCard>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Shared StatRow ───

interface StatRowProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}

function StatRow({ icon: Icon, label, value, color, bold }: StatRowProps) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <Icon size={16} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color }, bold && { fontWeight: '800', fontSize: 16 }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F1014',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSub: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeHero: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 48,
    fontWeight: '900',
  },
  noteText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  gradeLabel: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 6,
  },
  sectionLabel: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: '#E4E4E7',
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    width: 45,
    textAlign: 'right',
  },
  hint: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  budgetStat: {
    alignItems: 'center',
    gap: 4,
  },
  budgetNum: {
    fontSize: 24,
    fontWeight: '800',
  },
  budgetLabel: {
    color: '#71717A',
    fontSize: 11,
    textAlign: 'center',
  },
});
