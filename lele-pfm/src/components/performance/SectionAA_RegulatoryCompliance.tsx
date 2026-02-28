import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import {
  scanCompliance,
  ComplianceRule,
  FrameworkResult,
} from '@/domain/calculators/regulatory-engine';
import RadarChart from '@/components/charts/RadarChart';

export function SectionAA_RegulatoryCompliance() {
  const { t } = useTranslation('performance');
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const analysis = useMemo(() => {
    if (allocations.length === 0) return null;
    return scanCompliance(allocations);
  }, [allocations]);

  if (!investorProfile) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('compliance.noProfile')}
        </Text>
      </PerfGlassCard>
    );
  }

  const radarData = useMemo(() => {
    if (!analysis || analysis.frameworks.length < 3) return [];
    return analysis.frameworks.map((fw) => ({
      label: fw.label.slice(0, 10),
      value: fw.score,
      max: 100,
    }));
  }, [analysis]);

  if (!analysis) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>{t('compliance.noAllocations')}</Text>
      </PerfGlassCard>
    );
  }

  const totalViolations = analysis.frameworks.reduce((s, f) => s + f.violationCount, 0);
  const totalWarnings = analysis.frameworks.reduce((s, f) => s + f.warningCount, 0);

  const scoreColor =
    analysis.globalScore >= 85
      ? PF.green
      : analysis.globalScore >= 55
        ? PF.orange
        : PF.red;

  return (
    <View style={styles.container}>
      {/* Global score header */}
      <PerfGlassCard style={styles.section}>
        <View style={styles.scoreHeader}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>{analysis.globalScore}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.gradeText, { color: scoreColor }]}>{analysis.globalGrade}</Text>
            <Text style={styles.scoreSummaryLine}>
              {t('compliance.violationCount', { count: totalViolations })}
              {' \u00B7 '}
              {t('compliance.warningCount', { count: totalWarnings })}
            </Text>
          </View>
        </View>
        <Text style={styles.summaryText}>{analysis.summary}</Text>
        {radarData.length >= 3 && (
          <View style={styles.chartWrap}>
            <RadarChart data={radarData} size={220} color={PF.green} />
          </View>
        )}
      </PerfGlassCard>

      {/* Framework cards */}
      {analysis.frameworks.map((fw) => (
        <FrameworkCard key={fw.framework} framework={fw} />
      ))}

      {/* Critical violations */}
      {analysis.criticalViolations.length > 0 && (
        <PerfGlassCard style={[styles.section, styles.criticalCard]}>
          <Text style={styles.criticalTitle}>{t('compliance.criticalViolations')}</Text>
          {analysis.criticalViolations.map((v) => (
            <View key={v.id} style={styles.criticalRow}>
              <Text style={styles.criticalIcon}>{'\u274C'}</Text>
              <View style={styles.criticalContent}>
                <Text style={styles.criticalLabel}>{v.rule}</Text>
                <Text style={styles.criticalDetails}>{v.details}</Text>
                <Text style={styles.criticalRemediation}>{v.remediation}</Text>
              </View>
            </View>
          ))}
        </PerfGlassCard>
      )}

      {/* Top actions */}
      {analysis.topActions.length > 0 && (
        <PerfGlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('compliance.recommendedActions')}</Text>
          {analysis.topActions.map((action, i) => (
            <View key={i} style={styles.actionRow}>
              <Text style={styles.actionNumber}>{i + 1}.</Text>
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </PerfGlassCard>
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        {t('compliance.disclaimer')}
      </Text>
    </View>
  );
}

// ─── Framework Card ───

function FrameworkCard({ framework: fw }: { framework: FrameworkResult }) {
  const badgeColor =
    fw.score >= 85 ? PF.green : fw.score >= 55 ? PF.orange : PF.red;

  return (
    <PerfGlassCard style={styles.section}>
      {/* Header: label + score badge */}
      <View style={styles.fwHeader}>
        <Text style={styles.fwLabel}>{fw.label}</Text>
        <View style={[styles.fwBadge, { backgroundColor: badgeColor + '25' }]}>
          <Text style={[styles.fwBadgeText, { color: badgeColor }]}>
            {fw.score} — {fw.grade}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${fw.score}%`, backgroundColor: badgeColor },
          ]}
        />
      </View>

      {/* Rules list */}
      <View style={styles.rulesList}>
        {fw.rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} />
        ))}
      </View>

      {/* Framework summary */}
      <Text style={styles.fwSummary}>{fw.summary}</Text>
    </PerfGlassCard>
  );
}

// ─── Rule Row ───

function RuleRow({ rule }: { rule: ComplianceRule }) {
  const icon =
    rule.status === 'compliant'
      ? '\u2705'
      : rule.status === 'warning'
        ? '\u26A0\uFE0F'
        : '\u274C';

  const detailColor =
    rule.status === 'compliant'
      ? PF.green
      : rule.status === 'warning'
        ? PF.orange
        : PF.red;

  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleIcon}>{icon}</Text>
      <View style={styles.ruleContent}>
        <Text style={styles.ruleLabel}>{rule.rule}</Text>
        <Text style={[styles.ruleDetails, { color: detailColor }]}>{rule.details}</Text>
        {rule.status !== 'compliant' && (
          <View style={styles.remediationBox}>
            <Text style={styles.ruleRemediation}>{rule.remediation}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },

  // Global score
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  scoreUnit: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: -4,
  },
  scoreInfo: {
    flex: 1,
  },
  gradeText: {
    fontSize: 20,
    fontWeight: '800',
  },
  scoreSummaryLine: {
    color: PF.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  summaryText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  chartWrap: { alignItems: 'center', marginTop: 12 },

  // Framework card
  fwHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fwLabel: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  fwBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  fwBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fwSummary: {
    color: PF.textMuted,
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: PF.border,
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  // Rules list
  rulesList: {
    gap: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ruleIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  ruleContent: {
    flex: 1,
  },
  ruleLabel: {
    color: PF.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  ruleDetails: {
    fontSize: 11,
    marginTop: 1,
  },
  remediationBox: {
    marginTop: 3,
    borderLeftWidth: 2,
    borderLeftColor: PF.accent,
    paddingLeft: 8,
  },
  ruleRemediation: {
    color: PF.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },

  // Critical violations
  criticalCard: {
    borderColor: PF.red + '40',
    borderWidth: 1,
  },
  criticalTitle: {
    color: PF.red,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  criticalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  criticalIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  criticalContent: {
    flex: 1,
  },
  criticalLabel: {
    color: PF.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  criticalDetails: {
    color: PF.red,
    fontSize: 11,
    marginTop: 1,
  },
  criticalRemediation: {
    color: PF.textSecondary,
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Top actions
  sectionTitle: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  actionNumber: {
    color: PF.accent,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 18,
  },
  actionText: {
    color: PF.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },

  // Disclaimer
  disclaimer: {
    color: PF.textMuted,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
  },
});
