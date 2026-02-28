import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Clock,
  Wallet,
} from 'lucide-react-native';
import { PerfGlassCard, PF } from './shared';
import { AddAssetModal } from './AddAssetModal';
import MiniLineChart from '@/components/charts/MiniLineChart';
import { useMonthlyAllocation, BucketAllocation } from '@/hooks/useMonthlyAllocation';
import { useEmergencyFund } from '@/hooks/useEmergencyFund';
import { usePatrimoineAssets } from '@/hooks/usePatrimoineAssets';
import { formatCurrency } from '@/services/format-helpers';
import { PATRIMOINE_BUCKETS, ASSET_CLASSES } from '@/constants/patrimoine-buckets';

// ─── Lifestyle Inflation Banner ───

function LifestyleInflationBanner({ percent }: { percent: number }) {
  const { t } = useTranslation('performance');
  return (
    <PerfGlassCard style={styles.inflationCard}>
      <View style={styles.inflationRow}>
        <View style={[styles.inflationIconBox, { backgroundColor: '#FBBF2420' }]}>
          <AlertTriangle size={18} color="#FBBF24" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inflationTitle}>
            {t('patrimoine.lifestyleInflation.alert')}
          </Text>
          <Text style={styles.inflationText}>
            {t('patrimoine.lifestyleInflation.message', {
              percent: percent.toFixed(1),
            })}
          </Text>
        </View>
      </View>
    </PerfGlassCard>
  );
}

// ─── Waterfall Macro Card ───

function WaterfallMacroCard() {
  const { t } = useTranslation('performance');
  const allocation = useMonthlyAllocation();

  if (allocation.monthlyIncome === 0 && allocation.buckets.length === 0) {
    return (
      <PerfGlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Wallet size={18} color={PF.accent} />
          <Text style={styles.cardTitle}>{t('patrimoine.waterfallTitle')}</Text>
        </View>
        <Text style={styles.emptyText}>{t('patrimoine.noData')}</Text>
      </PerfGlassCard>
    );
  }

  return (
    <PerfGlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <Wallet size={18} color={PF.accent} />
        <Text style={styles.cardTitle}>{t('patrimoine.waterfallTitle')}</Text>
      </View>

      {/* Monthly income */}
      <View style={styles.incomeRow}>
        <Text style={styles.incomeLabel}>{t('patrimoine.monthlyIncome')}</Text>
        <Text style={styles.incomeValue}>
          {formatCurrency(allocation.monthlyIncome)}
        </Text>
      </View>

      {/* Bucket rows */}
      {allocation.buckets.map((bucket) => (
        <BucketRow key={bucket.code} bucket={bucket} />
      ))}

      {/* Surplus redirect */}
      {allocation.surplusFromPlaisir > 0 && (
        <View style={styles.surplusRow}>
          <Text style={styles.surplusText}>
            {t('patrimoine.surplusRedirect', {
              amount: formatCurrency(allocation.surplusFromPlaisir),
            })}
          </Text>
        </View>
      )}
    </PerfGlassCard>
  );
}

function BucketRow({ bucket }: { bucket: BucketAllocation }) {
  const { t } = useTranslation('performance');
  const cfg = PATRIMOINE_BUCKETS[bucket.code];
  const Icon = cfg.icon;
  const capped = Math.min(100, bucket.progressPercent);

  return (
    <View style={styles.bucketRow}>
      <View style={styles.bucketHeader}>
        <View style={styles.bucketLeft}>
          <Icon size={14} color={bucket.color} />
          <Text style={styles.bucketLabel}>
            {t(cfg.labelKey)} ({bucket.targetPercent}%)
          </Text>
        </View>
        <Text style={styles.bucketAmount}>
          {formatCurrency(bucket.actualAmount)}
        </Text>
      </View>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${capped}%`,
              backgroundColor: bucket.color,
            },
          ]}
        />
      </View>
      <View style={styles.bucketFooter}>
        <Text style={styles.bucketTarget}>
          {t('patrimoine.targetLabel')}: {formatCurrency(bucket.targetAmount)}
        </Text>
        <Text style={[styles.bucketPercent, { color: bucket.color }]}>
          {bucket.progressPercent.toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

// ─── Emergency Fund Gauge ───

function EmergencyFundGauge() {
  const { t } = useTranslation('performance');
  const fund = useEmergencyFund();

  if (fund.targetAmount === 0) {
    return (
      <PerfGlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <ShieldCheck size={18} color={PF.blue} />
          <Text style={styles.cardTitle}>
            {t('patrimoine.emergencyFund.title')}
          </Text>
        </View>
        <Text style={styles.emptyText}>
          {t('patrimoine.emergencyFund.noTarget')}
        </Text>
      </PerfGlassCard>
    );
  }

  return (
    <PerfGlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <ShieldCheck size={18} color={PF.blue} />
        <Text style={styles.cardTitle}>
          {t('patrimoine.emergencyFund.title')}
        </Text>
        {fund.isPriority && (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>
              {t('patrimoine.emergencyFund.priority')}
            </Text>
          </View>
        )}
      </View>

      {/* Amounts */}
      <View style={styles.fundAmounts}>
        <Text style={styles.fundAccumulated}>
          {formatCurrency(fund.accumulatedAmount)}
        </Text>
        <Text style={styles.fundSeparator}>/</Text>
        <Text style={styles.fundTarget}>
          {formatCurrency(fund.targetAmount)}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.fundProgressTrack}>
        <View
          style={[
            styles.fundProgressFill,
            {
              width: `${fund.progressPercent}%`,
              backgroundColor: fund.isComplete ? PF.green : PF.blue,
            },
          ]}
        />
      </View>

      {/* Info rows */}
      <View style={styles.fundInfoRow}>
        <Text style={styles.fundInfoLabel}>
          {t('patrimoine.emergencyFund.coverage')}
        </Text>
        <Text style={styles.fundInfoValue}>
          {fund.coverageMonths.toFixed(1)} {t('patrimoine.emergencyFund.months')}
        </Text>
      </View>

      {fund.weeksToTarget !== null && !fund.isComplete && (
        <View style={styles.fundInfoRow}>
          <View style={styles.projectionRow}>
            <Clock size={12} color={PF.textSecondary} />
            <Text style={styles.fundInfoLabel}>
              {t('patrimoine.emergencyFund.projection')}
            </Text>
          </View>
          <Text style={styles.fundInfoValue}>
            ~{fund.weeksToTarget} {t('patrimoine.emergencyFund.weeks')}
          </Text>
        </View>
      )}

      {fund.isComplete && (
        <View style={styles.completeBadge}>
          <ShieldCheck size={14} color={PF.green} />
          <Text style={styles.completeText}>
            {t('patrimoine.emergencyFund.complete')}
          </Text>
        </View>
      )}
    </PerfGlassCard>
  );
}

// ─── Asset Tracker Card ───

function AssetTrackerCard() {
  const { t } = useTranslation('performance');
  const patrimoine = usePatrimoineAssets();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <PerfGlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <TrendingUp size={18} color={PF.green} />
          <Text style={styles.cardTitle}>
            {t('patrimoine.assets.title')}
          </Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowModal(true)}
            hitSlop={8}
          >
            <Plus size={16} color={PF.darkBg} />
          </Pressable>
        </View>

        {!patrimoine.hasAssets ? (
          <Text style={styles.emptyText}>
            {t('patrimoine.assets.empty')}
          </Text>
        ) : (
          <>
            {/* Summary metrics */}
            <View style={styles.assetMetrics}>
              <View style={styles.assetMetricItem}>
                <Text style={styles.assetMetricLabel}>
                  {t('patrimoine.assets.totalAssets')}
                </Text>
                <Text style={styles.assetMetricValue}>
                  {formatCurrency(patrimoine.totalAssets)}
                </Text>
              </View>
              <View style={styles.assetMetricItem}>
                <Text style={styles.assetMetricLabel}>
                  {t('patrimoine.assets.passiveIncome')}
                </Text>
                <Text style={[styles.assetMetricValue, { color: PF.green }]}>
                  {formatCurrency(patrimoine.estimatedMonthlyPassiveIncome)}/m
                </Text>
              </View>
              <View style={styles.assetMetricItem}>
                <Text style={styles.assetMetricLabel}>
                  {t('patrimoine.assets.ratio')}
                </Text>
                <Text style={styles.assetMetricValue}>
                  {patrimoine.ratioAssetsToIncome.toFixed(1)}x
                </Text>
              </View>
            </View>

            {/* Liberty bar */}
            {patrimoine.libertyTarget > 0 && (
              <View style={styles.libertySection}>
                <View style={styles.libertyHeader}>
                  <Text style={styles.libertyLabel}>
                    {t('patrimoine.assets.liberty')}
                  </Text>
                  <Text style={styles.libertyPercent}>
                    {patrimoine.libertyPercent.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.libertyTrack}>
                  <View
                    style={[
                      styles.libertyFill,
                      { width: `${patrimoine.libertyPercent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.libertyTarget}>
                  {t('patrimoine.assets.libertyTarget', {
                    amount: formatCurrency(patrimoine.libertyTarget),
                  })}
                </Text>
              </View>
            )}

            {/* Class rows */}
            {patrimoine.byClass
              .filter((c) => c.count > 0)
              .map((cls) => {
                const cfg = ASSET_CLASSES[cls.assetClass];
                const Icon = cfg.icon;
                return (
                  <View key={cls.assetClass} style={styles.classRow}>
                    <View style={[styles.classIconBox, { backgroundColor: cls.color + '20' }]}>
                      <Icon size={14} color={cls.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.className}>{t(cls.labelKey)}</Text>
                      <Text style={styles.classCount}>
                        {cls.count} {cls.count > 1 ? t('patrimoine.assets.items') : t('patrimoine.assets.item')}
                      </Text>
                    </View>
                    <Text style={styles.classAmount}>
                      {formatCurrency(cls.totalValue)}
                    </Text>
                  </View>
                );
              })}
          </>
        )}
      </PerfGlassCard>

      <AddAssetModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

// ─── Main Section ───

export function SectionAD_Patrimoine() {
  const allocation = useMonthlyAllocation();
  const patrimoine = usePatrimoineAssets();

  // Patrimoine projection over 3 years (simple compound growth estimate)
  const projectionData = useMemo(() => {
    const totalNow = patrimoine.totalAssets;
    if (totalNow <= 0) return [];

    const monthlyPassive = patrimoine.estimatedMonthlyPassiveIncome;
    const annualGrowthRate = 0.05; // conservative 5% annual growth estimate

    return [
      { label: 'Now', value: totalNow },
      { label: 'An 1', value: totalNow * (1 + annualGrowthRate) + monthlyPassive * 12 },
      { label: 'An 2', value: totalNow * Math.pow(1 + annualGrowthRate, 2) + monthlyPassive * 24 },
      { label: 'An 3', value: totalNow * Math.pow(1 + annualGrowthRate, 3) + monthlyPassive * 36 },
    ];
  }, [patrimoine.totalAssets, patrimoine.estimatedMonthlyPassiveIncome]);

  return (
    <View style={styles.container}>
      {/* Lifestyle inflation banner */}
      {allocation.lifestyleInflationAlert &&
        allocation.lifestyleInflationPercent !== null && (
          <LifestyleInflationBanner percent={allocation.lifestyleInflationPercent} />
        )}

      {/* Waterfall macro */}
      <WaterfallMacroCard />

      {/* Emergency fund gauge */}
      <EmergencyFundGauge />

      {/* Asset tracker */}
      <AssetTrackerCard />

      {/* Patrimoine projection chart */}
      {projectionData.length > 0 && (
        <PerfGlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <TrendingUp size={18} color={PF.violet} />
            <Text style={styles.cardTitle}>Projection patrimoine</Text>
          </View>
          <MiniLineChart
            data={projectionData}
            color={PF.violet}
            showArea
            showLabels
            showDots
            height={130}
          />
        </PerfGlassCard>
      )}
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  // Inflation
  inflationCard: {
    borderColor: '#FBBF2430',
  },
  inflationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inflationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inflationTitle: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  inflationText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  // Cards
  card: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: PF.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  emptyText: {
    color: PF.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // Waterfall
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  incomeLabel: {
    color: PF.textSecondary,
    fontSize: 13,
  },
  incomeValue: {
    color: PF.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  bucketRow: {
    marginTop: 8,
  },
  bucketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bucketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bucketLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  bucketAmount: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  bucketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  bucketTarget: {
    color: PF.textMuted,
    fontSize: 10,
  },
  bucketPercent: {
    fontSize: 10,
    fontWeight: '700',
  },
  surplusRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PF.border,
  },
  surplusText: {
    color: PF.green,
    fontSize: 11,
    fontStyle: 'italic',
  },

  // Emergency fund
  priorityBadge: {
    backgroundColor: '#F8717120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    color: PF.red,
    fontSize: 10,
    fontWeight: '700',
  },
  fundAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  fundAccumulated: {
    color: PF.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  fundSeparator: {
    color: PF.textMuted,
    fontSize: 16,
  },
  fundTarget: {
    color: PF.textSecondary,
    fontSize: 14,
  },
  fundProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fundProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  fundInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fundInfoLabel: {
    color: PF.textSecondary,
    fontSize: 12,
  },
  fundInfoValue: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#4ADE8015',
  },
  completeText: {
    color: PF.green,
    fontSize: 12,
    fontWeight: '700',
  },

  // Assets
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PF.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetMetrics: {
    flexDirection: 'row',
    gap: 8,
  },
  assetMetricItem: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  assetMetricLabel: {
    color: PF.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  assetMetricValue: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  libertySection: {
    gap: 4,
  },
  libertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  libertyLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  libertyPercent: {
    color: PF.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  libertyTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  libertyFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: PF.gold,
  },
  libertyTarget: {
    color: PF.textMuted,
    fontSize: 10,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: PF.border,
  },
  classIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  className: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  classCount: {
    color: PF.textMuted,
    fontSize: 10,
  },
  classAmount: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
