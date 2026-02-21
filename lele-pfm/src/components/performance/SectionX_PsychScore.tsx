import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { calculateACE, ACEDimension, ACEFactor } from '@/domain/calculators/ace-score-engine';

// ─── Grade badge color ───

function gradeColor(grade: string): string {
  if (grade === 'A+' || grade === 'A') return PF.accent;
  if (grade === 'B') return PF.green;
  if (grade === 'C') return PF.orange;
  return PF.red;
}

// ─── Small reusable: progress bar ───

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

// ─── Dimension Row ───

function DimensionRow({ dim }: { dim: ACEDimension }) {
  const letter = dim.dimension === 'awareness' ? 'A' : dim.dimension === 'control' ? 'C' : 'E';
  const color = gradeColor(dim.grade);

  return (
    <View style={styles.dimRow}>
      <View style={[styles.dimLetter, { backgroundColor: color + '20' }]}>
        <Text style={[styles.dimLetterText, { color }]}>{letter}</Text>
      </View>
      <View style={styles.dimContent}>
        <View style={styles.dimHeader}>
          <Text style={styles.dimLabel}>{dim.label}</Text>
          <Text style={[styles.dimScore, { color }]}>{dim.score}/100</Text>
          <GradeBadge grade={dim.grade} />
        </View>
        <ProgressBar value={dim.score} color={color} />
      </View>
    </View>
  );
}

// ─── Factor Row (detail) ───

function FactorRow({ factor }: { factor: ACEFactor }) {
  const color = gradeColor(
    factor.score >= 85 ? 'A' : factor.score >= 70 ? 'B' : factor.score >= 55 ? 'C' : 'D',
  );

  return (
    <View style={styles.factorRow}>
      <View style={styles.factorHeader}>
        <Text style={styles.factorLabel}>{factor.label}</Text>
        <Text style={[styles.factorScore, { color }]}>{factor.score}</Text>
      </View>
      <ProgressBar value={factor.score} color={color} height={4} />
      <Text style={styles.factorExplanation}>{factor.explanation}</Text>
    </View>
  );
}

// ─── Dimension Detail Card ───

function DimensionDetail({ dim }: { dim: ACEDimension }) {
  const letter = dim.dimension === 'awareness' ? 'A' : dim.dimension === 'control' ? 'C' : 'E';

  return (
    <PerfGlassCard style={styles.detailCard}>
      <Text style={styles.detailTitle}>{letter} — {dim.label}</Text>
      <View style={styles.factorList}>
        {dim.factors.map((f) => (
          <FactorRow key={f.name} factor={f} />
        ))}
      </View>
      <View style={styles.recoCard}>
        <Text style={styles.recoLabel}>Recommandation</Text>
        <Text style={styles.recoText}>{dim.recommendation}</Text>
      </View>
    </PerfGlassCard>
  );
}

// ─── Main Section ───

export function SectionX_PsychScore() {
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const ace = useMemo(() => {
    if (!investorProfile || allocations.length === 0) return null;
    return calculateACE(allocations);
  }, [allocations, investorProfile]);

  if (!investorProfile || !ace) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          Configurez votre profil investisseur et vos allocations pour voir votre score psychologique ACE.
        </Text>
      </PerfGlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile + Global Score */}
      <PerfGlassCard style={styles.section}>
        <View style={styles.profileRow}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileLabel}>{ace.profile}</Text>
            <GradeBadge grade={ace.globalGrade} size="large" />
          </View>
          <Text style={styles.profileDesc}>{ace.profileDescription}</Text>
        </View>

        {/* Global Score */}
        <View style={styles.globalScoreWrap}>
          <Text style={styles.globalScoreValue}>{ace.globalScore}</Text>
          <Text style={styles.globalScoreMax}>/100</Text>
        </View>
      </PerfGlassCard>

      {/* 3 Dimension summary rows */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Dimensions ACE</Text>
        <DimensionRow dim={ace.awareness} />
        <DimensionRow dim={ace.control} />
        <DimensionRow dim={ace.execution} />
      </PerfGlassCard>

      {/* Strengths & Improvements */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Forces</Text>
        {ace.strengths.map((s, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: PF.green }]} />
            <Text style={styles.bulletText}>{s}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Axes d'amelioration</Text>
        {ace.improvements.map((s, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: PF.orange }]} />
            <Text style={styles.bulletText}>{s}</Text>
          </View>
        ))}
      </PerfGlassCard>

      {/* Per-dimension detail */}
      <DimensionDetail dim={ace.awareness} />
      <DimensionDetail dim={ace.control} />
      <DimensionDetail dim={ace.execution} />

      {/* Footer */}
      <Text style={styles.footerText}>
        Le score ACE mesure votre maturite psychologique d'investisseur a travers la conscience, la maitrise et l'execution. Il evolue avec vos allocations.
      </Text>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },

  // Profile
  profileRow: { marginBottom: 16 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  profileLabel: { color: PF.gold, fontSize: 18, fontWeight: '800', flex: 1 },
  profileDesc: { color: PF.textSecondary, fontSize: 12, lineHeight: 18 },

  // Global score
  globalScoreWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingVertical: 8 },
  globalScoreValue: { color: PF.accent, fontSize: 48, fontWeight: '900' },
  globalScoreMax: { color: PF.textMuted, fontSize: 18, fontWeight: '600', marginLeft: 2 },

  // Section title
  sectionTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },

  // Dimension row
  dimRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dimLetter: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dimLetterText: { fontSize: 16, fontWeight: '900' },
  dimContent: { flex: 1, gap: 4 },
  dimHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dimLabel: { color: PF.textSecondary, fontSize: 12, flex: 1 },
  dimScore: { fontSize: 12, fontWeight: '700' },

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

  // Bullet
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  bulletText: { color: PF.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },

  // Detail card
  detailCard: { marginBottom: 0 },
  detailTitle: { color: PF.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  factorList: { gap: 10 },

  // Factor row
  factorRow: { gap: 3 },
  factorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factorLabel: { color: PF.textSecondary, fontSize: 11, fontWeight: '600' },
  factorScore: { fontSize: 11, fontWeight: '800' },
  factorExplanation: { color: PF.textMuted, fontSize: 10, marginTop: 2 },

  // Recommendation card
  recoCard: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PF.gold + '40',
    backgroundColor: PF.gold + '08',
  },
  recoLabel: { color: PF.gold, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  recoText: { color: PF.textSecondary, fontSize: 12, lineHeight: 18 },

  // Footer
  footerText: { color: PF.textMuted, fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 16 },
});
