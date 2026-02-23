import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { analyzeBiases, BiasDetection } from '@/domain/calculators/behavioral-bias-engine';

// ─── Helpers ───

function severityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low': return PF.green;
    case 'medium': return PF.orange;
    case 'high': return PF.red;
  }
}

function scoreColor(score: number): string {
  if (score >= 7) return PF.green;
  if (score >= 4) return PF.orange;
  return PF.red;
}

// ─── Component ───

export function SectionV_BehavioralBiases() {
  const { t } = useTranslation('performance');
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const analysis = useMemo(() => analyzeBiases(allocations), [allocations]);

  if (!investorProfile) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('behavioral.configureProfile')}
        </Text>
      </PerfGlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Rationality Score */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('behavioral.behavioralAnalysis')}</Text>
        <View style={styles.scoreBadgeRow}>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor(analysis.overallScore) + '20' }]}>
            <Text style={[styles.scoreBadgeText, { color: scoreColor(analysis.overallScore) }]}>
              {t('behavioral.score')} : {analysis.overallScore.toFixed(1)}/10 — {analysis.rationalityGrade}
            </Text>
          </View>
        </View>
        <Text style={styles.summaryText}>{analysis.summary}</Text>
      </PerfGlassCard>

      {/* Top 3 Risks */}
      {analysis.topRisks.length > 0 && (
        <PerfGlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('behavioral.mainRisks')}</Text>
          <View style={styles.riskList}>
            {analysis.topRisks.map((bias) => (
              <BiasRiskCard key={bias.bias} bias={bias} />
            ))}
          </View>
        </PerfGlassCard>
      )}

      {/* Full Bias List */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('behavioral.allBiases')}</Text>
        <View style={styles.biasList}>
          {analysis.biases.map((bias) => (
            <View key={bias.bias} style={styles.biasRow}>
              <View style={[styles.severityDot, { backgroundColor: severityColor(bias.severity) }]} />
              <Text style={styles.biasLabel} numberOfLines={1}>{bias.label}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(100, bias.score * 10)}%`,
                      backgroundColor: severityColor(bias.severity),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.biasScore, { color: severityColor(bias.severity) }]}>
                {bias.score.toFixed(1)}
              </Text>
            </View>
          ))}
        </View>
      </PerfGlassCard>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('behavioral.disclaimer')}
        </Text>
      </View>
    </View>
  );
}

// ─── BiasRiskCard ───

function BiasRiskCard({ bias }: { bias: BiasDetection }) {
  const { t } = useTranslation('performance');
  const color = severityColor(bias.severity);
  return (
    <View style={styles.riskCard}>
      <View style={styles.riskHeader}>
        <View style={[styles.severityDot, { backgroundColor: color }]} />
        <Text style={styles.riskLabel}>{bias.label}</Text>
        <Text style={[styles.riskScore, { color }]}>{bias.score.toFixed(1)}/10</Text>
      </View>
      <View style={styles.riskBarContainer}>
        <View
          style={[
            styles.riskBarFill,
            { width: `${Math.min(100, bias.score * 10)}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.riskExplanation}>{bias.explanation}</Text>
      <View style={[styles.debiasingCard, { borderLeftColor: color }]}>
        <Text style={styles.debiasingTitle}>{t('behavioral.advice')}</Text>
        <Text style={styles.debiasingText}>{bias.debiasing}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
  sectionTitle: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: PF.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },

  // Score badge
  scoreBadgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  // Top risks
  riskList: { gap: 14 },
  riskCard: { gap: 8 },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskLabel: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  riskScore: {
    fontSize: 13,
    fontWeight: '800',
  },
  riskBarContainer: {
    height: 4,
    borderRadius: 2,
    backgroundColor: PF.border,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: 4,
    borderRadius: 2,
  },
  riskExplanation: {
    color: PF.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  debiasingCard: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 4,
  },
  debiasingTitle: {
    color: PF.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  debiasingText: {
    color: PF.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  // Full bias list
  biasList: { gap: 8 },
  biasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  biasLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  barContainer: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: PF.border,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  biasScore: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },

  // Footer
  footer: {
    paddingHorizontal: 4,
  },
  footerText: {
    color: PF.textMuted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
});
