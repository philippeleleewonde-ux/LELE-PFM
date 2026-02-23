import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useEngineStore } from '@/stores/engine-store';
import { ImpulseAnalysis } from '@/hooks/useImpulseCheck';

interface WealthVerdictProps {
  label: string;
  amount: number;
  analysis: ImpulseAnalysis;
  onBack: () => void;
  onClose: () => void;
}

function formatAmount(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function RuleCard({ multiplier, canAfford, needed, total, savings, currency }: {
  multiplier: number;
  canAfford: boolean;
  needed: number;
  total: number;
  savings: number;
  currency: string;
}) {
  const { t } = useTranslation('app');
  const target = total;
  const progress = target > 0 ? Math.min(100, Math.round((savings / target) * 100)) : 0;

  return (
    <View style={[styles.ruleCard, canAfford ? styles.ruleCardSuccess : styles.ruleCardFail]}>
      <View style={styles.ruleHeader}>
        <Text style={styles.ruleEmoji}>{canAfford ? '\u2705' : '\u274C'}</Text>
        <Text style={[styles.ruleTitle, canAfford ? styles.ruleTextGreen : styles.ruleTextRed]}>
          {canAfford
            ? t('impulse.ruleCanAfford', { multiplier })
            : t('impulse.ruleCannotAfford', { multiplier })}
        </Text>
      </View>

      <Text style={styles.ruleLine}>
        {t('impulse.youNeed', { amount: formatAmount(target), currency })}
      </Text>
      {!canAfford && (
        <Text style={styles.ruleLine}>
          {t('impulse.youMissing', { amount: formatAmount(needed), currency })}
        </Text>
      )}

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: canAfford ? '#4ADE80' : progress > 50 ? '#FBBF24' : '#F87171',
            },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>{progress}%</Text>
    </View>
  );
}

export function WealthVerdict({ label, amount, analysis, onBack, onClose }: WealthVerdictProps) {
  const { t } = useTranslation('app');
  const currency = useEngineStore((s) => s.currency) || 'FCFA';

  const overallVerdict = analysis.canAfford10x
    ? 'success'
    : analysis.canAfford5x
    ? 'warning'
    : 'fail';

  return (
    <View style={styles.container}>
      <Text style={styles.purchaseLabel} numberOfLines={1}>
        {label} — {formatAmount(amount)} {currency}
      </Text>

      {/* Savings info */}
      <View style={styles.savingsRow}>
        <Text style={styles.savingsLabel}>{t('impulse.piggyBank')}</Text>
        <Text style={styles.savingsAmount}>
          {formatAmount(analysis.totalSavings)} {currency}
        </Text>
      </View>

      {/* Overall verdict banner */}
      <View
        style={[
          styles.verdictBanner,
          overallVerdict === 'success' && styles.verdictSuccess,
          overallVerdict === 'warning' && styles.verdictWarning,
          overallVerdict === 'fail' && styles.verdictFail,
        ]}
      >
        <Text style={styles.verdictEmoji}>
          {overallVerdict === 'success' ? '\u2705' : overallVerdict === 'warning' ? '\u26A0\uFE0F' : '\u274C'}
        </Text>
        <Text style={styles.verdictText}>
          {overallVerdict === 'success'
            ? t('impulse.verdictSuccess')
            : overallVerdict === 'warning'
            ? t('impulse.verdictWarning')
            : t('impulse.verdictFail')}
        </Text>
      </View>

      {/* 10x Rule */}
      <RuleCard
        multiplier={10}
        canAfford={analysis.canAfford10x}
        needed={analysis.needed10x}
        total={amount * 10}
        savings={analysis.totalSavings}
        currency={currency}
      />

      {/* 5x Rule */}
      <RuleCard
        multiplier={5}
        canAfford={analysis.canAfford5x}
        needed={analysis.needed5x}
        total={amount * 5}
        savings={analysis.totalSavings}
        currency={currency}
      />

      {/* Time estimate */}
      {analysis.avgWeeklySavings > 0 && !analysis.canAfford5x && (
        <View style={styles.timeRow}>
          <Clock size={16} color="#A78BFA" />
          <Text style={styles.timeText}>
            {t('impulse.timeToReach5x', { savings: formatAmount(analysis.avgWeeklySavings), weeks: analysis.weeksToReach5x })}
          </Text>
        </View>
      )}

      {analysis.avgWeeklySavings > 0 && analysis.canAfford5x && !analysis.canAfford10x && (
        <View style={styles.timeRow}>
          <Clock size={16} color="#A78BFA" />
          <Text style={styles.timeText}>
            {t('impulse.timeToReach10x', { savings: formatAmount(analysis.avgWeeklySavings), weeks: analysis.weeksToReach10x })}
          </Text>
        </View>
      )}

      {/* Advice */}
      <View style={styles.adviceBox}>
        <Text style={styles.adviceEmoji}>{'\uD83D\uDCA1'}</Text>
        <Text style={styles.adviceText}>
          {overallVerdict === 'success'
            ? t('impulse.adviceSuccess')
            : t('impulse.adviceFail')}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={16} color="#A1A1AA" />
          <Text style={styles.backText}>{t('impulse.back')}</Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>{t('impulse.close')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  purchaseLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  savingsLabel: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  savingsAmount: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '700',
  },
  verdictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  verdictSuccess: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
  },
  verdictWarning: {
    backgroundColor: 'rgba(251,189,35,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.3)',
  },
  verdictFail: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  verdictEmoji: {
    fontSize: 18,
  },
  verdictText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  ruleCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  ruleCardSuccess: {
    backgroundColor: 'rgba(74,222,128,0.05)',
    borderColor: 'rgba(74,222,128,0.2)',
  },
  ruleCardFail: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ruleEmoji: {
    fontSize: 16,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  ruleTextGreen: {
    color: '#4ADE80',
  },
  ruleTextRed: {
    color: '#F87171',
  },
  ruleLine: {
    color: '#A1A1AA',
    fontSize: 13,
    marginLeft: 28,
    marginBottom: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 8,
    marginLeft: 28,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 28,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  timeText: {
    color: '#A78BFA',
    fontSize: 13,
    flex: 1,
  },
  adviceBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderRadius: 12,
    marginTop: 8,
  },
  adviceEmoji: {
    fontSize: 16,
  },
  adviceText: {
    color: '#D4D4D8',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  backText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
