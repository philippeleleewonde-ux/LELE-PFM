import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { synthesizeWisdom, PillarScore, WisdomAction } from '@/domain/calculators/wisdom-synthesis-engine';
import RadarChart from '@/components/charts/RadarChart';

// ─── Grade badge color ───

function gradeColor(grade: string): string {
  if (grade === 'A+' || grade === 'A') return PF.accent;
  if (grade === 'B') return PF.green;
  if (grade === 'C') return PF.orange;
  return PF.red;
}

// ─── Progress bar ───

function ProgressBar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
  return (
    <View style={[barStyles.track, { height }]}>
      <View style={[barStyles.fill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  fill: { borderRadius: 4 },
});

// ─── Score color by value ───

function scoreColor(score: number): string {
  if (score >= 80) return PF.green;
  if (score >= 60) return PF.orange;
  return PF.red;
}

// ─── Impact badge ───

type TFunction = (key: string, options?: Record<string, unknown>) => string;

function ImpactBadge({ impact, t }: { impact: WisdomAction['impact']; t: TFunction }) {
  const color = impact === 'high' ? PF.red : impact === 'medium' ? PF.orange : PF.green;
  const label = impact === 'high' ? t('wisdom.urgent') : impact === 'medium' ? t('wisdom.medium') : t('wisdom.low');
  return (
    <View style={[styles.impactBadge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.impactText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Grade Badge ───

function GradeBadge({ grade, size = 'normal' }: { grade: string; size?: 'normal' | 'large' }) {
  const bg = gradeColor(grade);
  const isLarge = size === 'large';
  return (
    <View style={[styles.gradeBadge, { backgroundColor: bg + '25', borderColor: bg }, isLarge && styles.gradeBadgeLg]}>
      <Text style={[styles.gradeText, { color: bg }, isLarge && styles.gradeTextLg]}>{grade}</Text>
    </View>
  );
}

// ─── Maturity pill ───

function MaturityPill({ label, grade }: { label: string; grade: string }) {
  const bg = gradeColor(grade);
  return (
    <View style={[styles.maturityPill, { backgroundColor: bg + '20' }]}>
      <Text style={[styles.maturityText, { color: bg }]}>{label}</Text>
    </View>
  );
}

// ─── Pillar Row ───

function PillarRow({ pillar }: { pillar: PillarScore }) {
  const color = scoreColor(pillar.score);
  return (
    <View style={styles.pillarRow}>
      <Text style={styles.pillarLabel}>{pillar.label}</Text>
      <View style={styles.pillarBarWrap}>
        <ProgressBar value={pillar.score} color={color} />
      </View>
      <Text style={[styles.pillarScore, { color }]}>{pillar.score}/100</Text>
    </View>
  );
}

// ─── Action Row ───

function ActionRow({ action, t }: { action: WisdomAction; t: TFunction }) {
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionNumber}>
        <Text style={styles.actionNumberText}>{action.priority}</Text>
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionText}>{action.action}</Text>
        <Text style={styles.actionCategory}>{action.category}</Text>
      </View>
      <ImpactBadge impact={action.impact} t={t} />
    </View>
  );
}

// ─── Main Section ───

export function SectionAC_WisdomSynthesis() {
  const { t } = useTranslation('performance');
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const synthesis = useMemo(() => {
    if (!investorProfile || allocations.length === 0) return null;
    return synthesizeWisdom(allocations);
  }, [allocations, investorProfile]);

  const radarData = useMemo(() => {
    if (!synthesis || synthesis.pillars.length < 3) return [];
    return synthesis.pillars.map((p) => ({
      label: p.label.slice(0, 10),
      value: p.score,
      max: 100,
    }));
  }, [synthesis]);

  if (!investorProfile || !synthesis) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('wisdom.configureProfile')}
        </Text>
      </PerfGlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Global Score Card */}
      <PerfGlassCard style={styles.section}>
        <View style={styles.globalScoreWrap}>
          <Text style={styles.globalScoreValue}>{synthesis.globalScore}</Text>
          <Text style={styles.globalScoreMax}>/100</Text>
        </View>
        <View style={styles.badgeRow}>
          <GradeBadge grade={synthesis.globalGrade} size="large" />
          <MaturityPill label={synthesis.maturityLabel} grade={synthesis.globalGrade} />
        </View>
      </PerfGlassCard>

      {/* Wisdom Radar */}
      {radarData.length >= 3 && (
        <PerfGlassCard style={styles.section}>
          <View style={styles.chartWrap}>
            <RadarChart data={radarData} size={220} color={PF.accent} />
          </View>
        </PerfGlassCard>
      )}

      {/* Pillar Scores Card */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('wisdom.pillarScores')}</Text>
        {synthesis.pillars.map((p) => (
          <PillarRow key={p.pillar} pillar={p} />
        ))}
      </PerfGlassCard>

      {/* Strengths Card */}
      <PerfGlassCard style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.bulletDot, { backgroundColor: PF.green }]} />
          <Text style={styles.sectionTitle}>{t('wisdom.strengths')}</Text>
        </View>
        {synthesis.topStrengths.map((s, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: PF.green }]} />
            <Text style={styles.bulletText}>{s}</Text>
          </View>
        ))}
      </PerfGlassCard>

      {/* Risks Card */}
      <PerfGlassCard style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.bulletDot, { backgroundColor: PF.orange }]} />
          <Text style={styles.sectionTitle}>{t('wisdom.risks')}</Text>
        </View>
        {synthesis.topRisks.map((r, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: PF.orange }]} />
            <Text style={styles.bulletText}>{r}</Text>
          </View>
        ))}
      </PerfGlassCard>

      {/* Action Plan Card */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('wisdom.actionPlan')}</Text>
        {synthesis.actionPlan.map((a) => (
          <ActionRow key={a.priority} action={a} t={t} />
        ))}
      </PerfGlassCard>

      {/* Verdict Card */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.verdictText}>{synthesis.verdict}</Text>
        <Text style={styles.footerText}>
          {t('wisdom.disclaimer')}
        </Text>
      </PerfGlassCard>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },
  chartWrap: { alignItems: 'center' },

  // Global score
  globalScoreWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  globalScoreValue: { color: PF.accent, fontSize: 48, fontWeight: '900' },
  globalScoreMax: { color: PF.textMuted, fontSize: 18, fontWeight: '600', marginLeft: 2 },

  // Badge row
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },

  // Grade badge
  gradeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  gradeBadgeLg: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gradeText: { fontSize: 11, fontWeight: '800' },
  gradeTextLg: { fontSize: 14 },

  // Maturity pill
  maturityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  maturityText: { fontSize: 12, fontWeight: '700' },

  // Section title
  sectionTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },

  // Pillar row
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pillarLabel: { color: PF.textSecondary, fontSize: 12, width: 100 },
  pillarBarWrap: { flex: 1 },
  pillarScore: { fontSize: 12, fontWeight: '700', width: 50, textAlign: 'right' },

  // Bullet
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  bulletText: { color: PF.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },

  // Action row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  actionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PF.green + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionNumberText: { color: PF.green, fontSize: 12, fontWeight: '800' },
  actionContent: { flex: 1 },
  actionText: { color: PF.textSecondary, fontSize: 12, lineHeight: 18 },
  actionCategory: { color: PF.textMuted, fontSize: 10, marginTop: 2 },

  // Impact badge
  impactBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  impactText: { fontSize: 10, fontWeight: '700' },

  // Verdict
  verdictText: { color: PF.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  footerText: {
    color: PF.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
