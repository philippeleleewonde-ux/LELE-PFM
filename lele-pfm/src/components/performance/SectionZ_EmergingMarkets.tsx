import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import {
  analyzeEmergingMarkets,
  RegionExposure,
  RegionOutlook,
} from '@/domain/calculators/emerging-markets-engine';

// ─── Outlook helpers ───

function outlookColor(outlook: RegionOutlook): string {
  switch (outlook) {
    case 'bullish': return PF.green;
    case 'neutral': return PF.accent;
    case 'cautious': return PF.red;
  }
}

function outlookLabel(outlook: RegionOutlook, t: (key: string) => string): string {
  switch (outlook) {
    case 'bullish': return t('emergingMarkets.outlook.bullish');
    case 'neutral': return t('emergingMarkets.outlook.neutral');
    case 'cautious': return t('emergingMarkets.outlook.cautious');
  }
}

// ─── Component ───

export function SectionZ_EmergingMarkets() {
  const { t } = useTranslation('performance');
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const analysis = useMemo(() => analyzeEmergingMarkets(allocations), [allocations]);

  if (!investorProfile) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('emergingMarkets.configureProfile')}
        </Text>
      </PerfGlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Score header */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('emergingMarkets.radar')}</Text>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>{t('emergingMarkets.geoDiversification')}</Text>
            <Text style={[styles.scoreValue, { color: diversificationColor(analysis.diversificationScore) }]}>
              {analysis.diversificationScore}/100
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>{t('emergingMarkets.emergingExposure')}</Text>
            <Text style={[styles.scoreValue, { color: PF.accent }]}>
              {analysis.totalEmergingExposure}%
            </Text>
          </View>
        </View>
        <Text style={styles.summaryText}>{analysis.summary}</Text>
      </PerfGlassCard>

      {/* Region cards */}
      {analysis.regions.map((re) => (
        <RegionCard key={re.region.id} data={re} />
      ))}

      {/* Top opportunity highlight */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('emergingMarkets.bestOpportunity')}</Text>
        <View style={styles.highlightRow}>
          <Text style={styles.highlightEmoji}>{analysis.topOpportunity.emoji}</Text>
          <View style={styles.highlightInfo}>
            <Text style={styles.highlightName}>{analysis.topOpportunity.name}</Text>
            <Text style={[styles.highlightScore, { color: PF.green }]}>
              {t('emergingMarkets.opportunityScore', { score: analysis.topOpportunity.opportunityScore })}
            </Text>
          </View>
        </View>
        <Text style={styles.outlookBody}>{analysis.topOpportunity.outlookText}</Text>
      </PerfGlassCard>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <PerfGlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('emergingMarkets.recommendations')}</Text>
          {analysis.recommendations.map((rec, i) => (
            <View key={i} style={styles.recRow}>
              <Text style={styles.recNumber}>{i + 1}.</Text>
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </PerfGlassCard>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        {t('emergingMarkets.disclaimer')}
      </Text>
    </View>
  );
}

// ─── Region Card ───

function RegionCard({ data }: { data: RegionExposure }) {
  const { t } = useTranslation('performance');
  const { region, portfolioExposure, alignmentScore, recommendation } = data;
  const oColor = outlookColor(region.outlook);

  return (
    <PerfGlassCard style={styles.section}>
      {/* Header */}
      <View style={styles.regionHeader}>
        <Text style={styles.regionEmoji}>{region.emoji}</Text>
        <View style={styles.regionTitleBlock}>
          <Text style={styles.regionName}>{region.name}</Text>
          <View style={[styles.outlookBadge, { backgroundColor: oColor + '20' }]}>
            <Text style={[styles.outlookBadgeText, { color: oColor }]}>{outlookLabel(region.outlook, t)}</Text>
          </View>
        </View>
      </View>

      {/* Macro row */}
      <View style={styles.macroRow}>
        <MacroStat label="PIB" value={`${region.gdpGrowth}%`} />
        <MacroStat label="Inflation" value={`${region.inflationRate}%`} />
        <MacroStat label="Risque" value={`${region.riskScore}`} />
      </View>

      {/* Opportunity bar */}
      <View style={styles.barContainer}>
        <Text style={styles.barLabel}>{t('emergingMarkets.opportunity')}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${region.opportunityScore}%`, backgroundColor: oColor }]} />
        </View>
        <Text style={[styles.barValue, { color: oColor }]}>{region.opportunityScore}</Text>
      </View>

      {/* Exposure + alignment */}
      <View style={styles.exposureRow}>
        <Text style={styles.exposureLabel}>{t('emergingMarkets.yourExposure')}</Text>
        <Text style={[styles.exposureValue, { color: portfolioExposure > 0 ? PF.accent : PF.textMuted }]}>
          {portfolioExposure > 0 ? `${portfolioExposure}%` : '--'}
        </Text>
      </View>
      <View style={styles.exposureRow}>
        <Text style={styles.exposureLabel}>{t('emergingMarkets.alignment')}</Text>
        <Text style={[styles.exposureValue, { color: alignmentScore >= 50 ? PF.green : PF.textSecondary }]}>
          {alignmentScore}%
        </Text>
      </View>

      {/* Strengths */}
      <View style={styles.listBlock}>
        {region.keyStrengths.map((s, i) => (
          <View key={i} style={styles.listRow}>
            <View style={[styles.listDot, { backgroundColor: PF.green }]} />
            <Text style={styles.listText}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Risks */}
      <View style={styles.listBlock}>
        {region.keyRisks.map((r, i) => (
          <View key={i} style={styles.listRow}>
            <View style={[styles.listDot, { backgroundColor: PF.red }]} />
            <Text style={styles.listText}>{r}</Text>
          </View>
        ))}
      </View>

      {/* Recommendation */}
      <View style={styles.recCard}>
        <Text style={styles.recCardText}>{recommendation}</Text>
      </View>
    </PerfGlassCard>
  );
}

// ─── Macro Stat ───

function MacroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

// ─── Helpers ───

function diversificationColor(score: number): string {
  if (score >= 60) return PF.green;
  if (score >= 30) return PF.accent;
  return PF.red;
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },

  // Score header
  sectionTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  scoreItem: { alignItems: 'center' },
  scoreLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  scoreValue: { fontSize: 20, fontWeight: '800' },
  summaryText: { color: PF.textSecondary, fontSize: 12, lineHeight: 18 },

  // Region card
  regionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  regionEmoji: { fontSize: 28 },
  regionTitleBlock: { flex: 1, gap: 4 },
  regionName: { color: PF.textPrimary, fontSize: 15, fontWeight: '700' },
  outlookBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  outlookBadgeText: { fontSize: 11, fontWeight: '700' },

  // Macro row
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: PF.border },
  macroItem: { alignItems: 'center' },
  macroLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  macroValue: { color: PF.textPrimary, fontSize: 14, fontWeight: '700' },

  // Opportunity bar
  barContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  barLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', width: 70 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: PF.border },
  barFill: { height: 6, borderRadius: 3 },
  barValue: { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },

  // Exposure
  exposureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  exposureLabel: { color: PF.textMuted, fontSize: 11, fontWeight: '600' },
  exposureValue: { fontSize: 14, fontWeight: '800' },

  // Lists
  listBlock: { gap: 4, marginBottom: 8 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  listDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  listText: { color: PF.textSecondary, fontSize: 11, flex: 1, lineHeight: 16 },

  // Recommendation card
  recCard: { backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 8, padding: 10, marginTop: 4 },
  recCardText: { color: PF.accent, fontSize: 11, lineHeight: 16 },

  // Recommendation list
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  recNumber: { color: PF.accent, fontSize: 12, fontWeight: '700', width: 18 },
  recText: { color: PF.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },

  // Highlight
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  highlightEmoji: { fontSize: 32 },
  highlightInfo: { flex: 1 },
  highlightName: { color: PF.textPrimary, fontSize: 15, fontWeight: '700' },
  highlightScore: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  outlookBody: { color: PF.textSecondary, fontSize: 11, lineHeight: 17 },

  // Footer
  footer: { color: PF.textMuted, fontSize: 10, textAlign: 'center', marginTop: 4, paddingHorizontal: 8 },
});
