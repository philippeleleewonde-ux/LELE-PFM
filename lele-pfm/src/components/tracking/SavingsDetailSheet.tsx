import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, PiggyBank, Wallet, Calendar, Banknote } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { getGradeColor } from '@/domain/calculators/weekly-savings-engine';
import type { SavingsWallet, YearBucket } from '@/hooks/useSavingsWallet';
import { getWeekLabel } from '@/utils/week-helpers';

type FilterMode = 'week' | 'month' | 'year';

interface SavingsDetailSheetProps {
  visible: boolean;
  wallet: SavingsWallet;
  onClose: () => void;
}

export function SavingsDetailSheet({ visible, wallet, onClose }: SavingsDetailSheetProps) {
  const { t } = useTranslation('tracking');
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const [filter, setFilter] = useState<FilterMode>('month');

  // Build year entries from byYear map
  const yearEntries = useMemo(() => {
    const entries: { year: number; bucket: YearBucket }[] = [];
    wallet.byYear.forEach((bucket, year) => {
      entries.push({ year, bucket });
    });
    return entries.sort((a, b) => b.year - a.year);
  }, [wallet.byYear]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { maxHeight: height * (isSmall ? 0.95 : 0.85), paddingHorizontal: isSmall ? 14 : 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Calendar size={18} color="#FBBF24" />
              <Text style={styles.headerTitle}>{t('savingsHistory.title')}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {(['week', 'month', 'year'] as FilterMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setFilter(mode)}
                style={[styles.pill, filter === mode && styles.pillActive]}
              >
                <Text style={[styles.pillText, filter === mode && styles.pillTextActive]}>
                  {mode === 'week' ? t('savingsHistory.weekFilter') : mode === 'month' ? t('savingsHistory.monthFilter') : t('savingsHistory.yearFilter')}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.listContent, { paddingBottom: isSmall ? 24 : 40 }]}>
            {/* Week View */}
            {filter === 'week' && (
              <>
                {wallet.allWeeksSorted.length === 0 && (
                  <Text style={styles.emptyText}>{t('savingsHistory.emptyWeek')}</Text>
                )}
                {wallet.allWeeksSorted.map((r) => (
                  <PeriodRow
                    key={r.id}
                    label={`S${r.week_number}`}
                    sublabel={getWeekLabel(r.week_number, r.year)}
                    economies={r.economiesTotal}
                    economiesReelles={r.economies}
                    depassement={r.depassement}
                    grade={r.grade}
                    gradeColor={getGradeColor(r.grade)}
                  />
                ))}
              </>
            )}

            {/* Month View */}
            {filter === 'month' && (
              <>
                {wallet.byMonth.length === 0 && (
                  <Text style={styles.emptyText}>{t('savingsHistory.emptyMonth')}</Text>
                )}
                {wallet.byMonth.map((m) => (
                  <PeriodRow
                    key={`${m.year}-${m.month}`}
                    label={t(`months.${m.month - 1}`)}
                    sublabel={`${m.year} - ${m.nbSemaines} sem.`}
                    economies={m.economies}
                    economiesReelles={m.economiesReelles}
                    depassement={m.depassement}
                    grade={m.grade}
                    gradeColor={getGradeColor(m.grade)}
                  />
                ))}
              </>
            )}

            {/* Year View */}
            {filter === 'year' && (
              <>
                {yearEntries.length === 0 && (
                  <Text style={styles.emptyText}>{t('savingsHistory.emptyYear')}</Text>
                )}
                {yearEntries.map(({ year, bucket }) => {
                  const net = bucket.economies - bucket.depassement;
                  return (
                    <View key={year} style={styles.yearRow}>
                      <View style={styles.yearLeft}>
                        <Text style={[styles.yearLabel, isSmall && { fontSize: 14 }]}>{year}</Text>
                        <Text style={styles.yearSub}>{bucket.nbSemaines} {t('savingsHistory.weeks')}</Text>
                      </View>
                      <View style={styles.yearRight}>
                        <Text style={[styles.yearValue, { color: net >= 0 ? '#4ADE80' : '#F87171' }]}>
                          {net >= 0 ? '+' : ''}{formatCurrency(net)}
                        </Text>
                        <Text style={styles.yearDist}>
                          {t('savingsHistory.savingsShort')} {formatCurrency(bucket.epargne)} | {t('savingsHistory.funShort')} {formatCurrency(bucket.discretionnaire)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {/* Non depense total */}
            {wallet.allTimeNonDepense > 0 && (
              <View style={[styles.nonDepenseCard, isSmall && { paddingHorizontal: 10 }]}>
                <Banknote size={14} color="#60A5FA" />
                <Text style={styles.nonDepenseLabel}>{t('savingsHistory.cumulUnsaved')}</Text>
                <Text style={styles.nonDepenseValue}>{formatCurrency(wallet.allTimeNonDepense)}</Text>
              </View>
            )}

            {/* All-time Total (cashback) */}
            <GlassCard variant="dark" style={styles.totalCard}>
              <Text style={styles.totalLabel}>{t('savingsHistory.validatedSavings')}</Text>
              <Text style={[styles.totalValue, { color: wallet.allTimeNet >= 0 ? '#4ADE80' : '#F87171', fontSize: isSmall ? 18 : 20 }]}>
                {wallet.allTimeNet >= 0 ? '+' : ''}{formatCurrency(wallet.allTimeNet)}
              </Text>
              <View style={styles.totalDistRow}>
                <View style={styles.totalDistItem}>
                  <PiggyBank size={12} color="#4ADE80" />
                  <Text style={styles.totalDistText}>{formatCurrency(wallet.allTimeEpargne)}</Text>
                </View>
                <View style={styles.totalDistItem}>
                  <Wallet size={12} color="#A78BFA" />
                  <Text style={styles.totalDistText}>{formatCurrency(wallet.allTimeDiscretionnaire)}</Text>
                </View>
              </View>
              <Text style={styles.totalSub}>
                {wallet.nbSemainesTotal} {t('savingsHistory.weeksSince')}{' '}
                {wallet.firstRecordDate
                  ? new Date(wallet.firstRecordDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                  : '—'}
              </Text>
            </GlassCard>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Period Row ───

interface PeriodRowProps {
  label: string;
  sublabel: string;
  economies: number;
  economiesReelles?: number;
  depassement: number;
  grade: string;
  gradeColor: string;
}

function PeriodRow({ label, sublabel, economies, economiesReelles, depassement, grade, gradeColor }: PeriodRowProps) {
  const net = economies - depassement;
  return (
    <View style={styles.periodRow}>
      <View style={styles.periodLeft}>
        <Text style={styles.periodLabel}>{label}</Text>
        <Text style={styles.periodSub}>{sublabel}</Text>
        {economiesReelles != null && economiesReelles > economies && (
          <Text style={styles.periodNonDepense}>
            Non dep. {formatCurrency(economiesReelles)}
          </Text>
        )}
      </View>
      <View style={styles.periodRight}>
        <Text style={[styles.periodValue, { color: net >= 0 ? '#4ADE80' : '#F87171' }]}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </Text>
        <View style={[styles.gradePill, { backgroundColor: gradeColor + '20', borderColor: gradeColor + '40' }]}>
          <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#0F1014',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxWidth: 600,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: 'rgba(251,189,35,0.12)',
    borderColor: '#FBBF24',
  },
  pillText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FBBF24',
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyText: {
    color: '#52525B',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Period row (week/month)
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  periodLeft: {
    gap: 2,
  },
  periodLabel: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '700',
  },
  periodSub: {
    color: '#71717A',
    fontSize: 11,
  },
  periodNonDepense: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  periodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  gradePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Year row
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  yearLeft: {
    gap: 2,
  },
  yearLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  yearSub: {
    color: '#71717A',
    fontSize: 11,
  },
  yearRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  yearValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  yearDist: {
    color: '#52525B',
    fontSize: 10,
  },
  // Non depense card
  nonDepenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.15)',
  },
  nonDepenseLabel: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  nonDepenseValue: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '800',
  },
  // Total card
  totalCard: {
    marginTop: 16,
    alignItems: 'center',
  },
  totalLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  totalDistRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  totalDistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalDistText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  totalSub: {
    color: '#52525B',
    fontSize: 11,
  },
});
