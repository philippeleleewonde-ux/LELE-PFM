import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { X, Info } from 'lucide-react-native';
import { PF, PerfGlassCard } from '@/components/performance/shared';
import { PILLAR_CONFIG } from '@/constants/pillar-mapping';
import { SelectedAsset, RecommendationScoreBreakdown } from '@/types/investor-journey';

const PILLAR_EMOJI: Record<string, string> = {
  croissance: '\u{1F680}',
  amortisseur: '\u{1F6E1}\u{FE0F}',
  refuge: '\u{1F3DB}\u{FE0F}',
  base_arriere: '\u{1F512}',
};

const PILLAR_LABELS: Record<string, string> = {
  croissance: 'Croissance',
  amortisseur: 'Amortisseur',
  refuge: 'Refuge',
  base_arriere: 'Base Arriere',
};

const LIQUIDITY_LABELS: Record<string, string> = {
  immediate: 'Immediat',
  days: 'Quelques jours',
  weeks: 'Quelques semaines',
  months: 'Quelques mois',
  locked: 'Bloque',
};

const RISK_LABELS: Record<number, string> = {
  1: 'Tres faible',
  2: 'Faible',
  3: 'Modere',
  4: 'Eleve',
  5: 'Tres eleve',
};

const SCORE_DIMENSIONS: { key: keyof Omit<RecommendationScoreBreakdown, 'total'>; label: string; max: number }[] = [
  { key: 'riskAlignment', label: 'Alignement risque', max: 25 },
  { key: 'returnAttractiveness', label: 'Rendement', max: 20 },
  { key: 'liquidityMatch', label: 'Liquidite', max: 15 },
  { key: 'shariaCompliance', label: 'Sharia', max: 10 },
  { key: 'ekhGate', label: 'EKH', max: 10 },
  { key: 'diversification', label: 'Diversification', max: 10 },
  { key: 'countryInfra', label: 'Infra. pays', max: 5 },
  { key: 'taxAdvantage', label: 'Fiscal', max: 5 },
];

interface AssetInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  asset: SelectedAsset;
  scoreBreakdown: RecommendationScoreBreakdown | null;
}

function generateNarration(asset: SelectedAsset, breakdown: RecommendationScoreBreakdown | null): string[] {
  const lines: string[] = [];

  if (breakdown) {
    if (breakdown.riskAlignment >= 20) {
      lines.push(`Correspond bien a votre profil de risque (score ${breakdown.riskAlignment}/25).`);
    } else if (breakdown.riskAlignment >= 10) {
      lines.push(`Compatible avec votre tolerance au risque, avec quelques reserves.`);
    }

    if (breakdown.returnAttractiveness >= 14) {
      lines.push(`Rendement attractif de ${asset.expectedReturnRate}% par an.`);
    } else if (breakdown.returnAttractiveness >= 10) {
      lines.push(`Rendement correct de ${asset.expectedReturnRate}% par an.`);
    } else {
      lines.push(`Rendement modeste de ${asset.expectedReturnRate}% — oriente securite.`);
    }

    if (breakdown.liquidityMatch >= 13) {
      lines.push(`Liquidite adaptee a votre horizon d'investissement.`);
    }

    if (breakdown.diversification >= 7) {
      lines.push(`Diversifie votre pilier ${PILLAR_LABELS[asset.pillar] ?? asset.pillar}.`);
    }

    if (breakdown.shariaCompliance === 10 && asset.shariaCompliant) {
      lines.push(`Conforme aux principes de la finance islamique.`);
    }

    if (breakdown.taxAdvantage === 5) {
      lines.push(`Beneficie d'un avantage fiscal.`);
    }
  }

  if (lines.length === 0) {
    lines.push(`Actif recommande dans le pilier ${PILLAR_LABELS[asset.pillar] ?? asset.pillar}.`);
  }

  return lines;
}

function getBarColor(ratio: number): string {
  if (ratio >= 0.8) return PF.green;
  if (ratio >= 0.5) return PF.accent;
  if (ratio >= 0.3) return PF.orange;
  return PF.red;
}

export function AssetInfoSheet({ visible, onClose, asset, scoreBreakdown }: AssetInfoSheetProps) {
  const pillarConfig = PILLAR_CONFIG[asset.pillar];
  const narration = generateNarration(asset, scoreBreakdown);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerEmoji}>{PILLAR_EMOJI[asset.pillar] ?? '\u{1F4CA}'}</Text>
              <View style={styles.headerTitleCol}>
                <Text style={styles.headerTitle} numberOfLines={2}>{asset.name}</Text>
                <View style={[styles.pillarBadge, { backgroundColor: pillarConfig.color + '20', borderColor: pillarConfig.color + '40' }]}>
                  <Text style={[styles.pillarBadgeText, { color: pillarConfig.color }]}>
                    {PILLAR_LABELS[asset.pillar] ?? asset.pillar}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={PF.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Description */}
            {asset.product?.description ? (
              <PerfGlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{asset.product.description}</Text>
              </PerfGlassCard>
            ) : null}

            {/* Pourquoi cet actif */}
            <PerfGlassCard style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Info size={14} color={PF.blue} />
                <Text style={styles.sectionTitle}>Pourquoi cet actif ?</Text>
              </View>
              {narration.map((line, i) => (
                <View key={i} style={styles.narrationRow}>
                  <Text style={styles.narrationBullet}>{'\u2022'}</Text>
                  <Text style={styles.narrationText}>{line}</Text>
                </View>
              ))}
            </PerfGlassCard>

            {/* Score breakdown */}
            {scoreBreakdown && (
              <PerfGlassCard style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Score de recommandation</Text>
                  <View style={[styles.totalScoreBadge, { backgroundColor: getBarColor(scoreBreakdown.total / 100) + '20' }]}>
                    <Text style={[styles.totalScoreText, { color: getBarColor(scoreBreakdown.total / 100) }]}>
                      {scoreBreakdown.total}/100
                    </Text>
                  </View>
                </View>

                {SCORE_DIMENSIONS.map((dim) => {
                  const score = scoreBreakdown[dim.key];
                  const ratio = dim.max > 0 ? score / dim.max : 0;
                  return (
                    <View key={dim.key} style={styles.barRow}>
                      <Text style={styles.barLabel}>{dim.label}</Text>
                      <View style={styles.barTrackOuter}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.round(ratio * 100)}%`,
                              backgroundColor: getBarColor(ratio),
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barScore, { color: getBarColor(ratio) }]}>
                        {score}/{dim.max}
                      </Text>
                    </View>
                  );
                })}
              </PerfGlassCard>
            )}

            {/* Metriques cles */}
            <PerfGlassCard style={styles.section}>
              <Text style={styles.sectionTitle}>Metriques cles</Text>
              <View style={styles.metricsGrid}>
                <MetricItem label="Rendement" value={`${asset.expectedReturnRate}%`} color={PF.green} />
                <MetricItem label="Volatilite" value={`${asset.volatility}%`} color={PF.orange} />
                <MetricItem label="Risque" value={RISK_LABELS[asset.riskLevel] ?? `${asset.riskLevel}/5`} color={asset.riskLevel <= 2 ? PF.green : asset.riskLevel <= 3 ? PF.accent : PF.red} />
                <MetricItem label="Liquidite" value={LIQUIDITY_LABELS[asset.liquidity] ?? asset.liquidity} color={PF.blue} />
                {asset.product && (
                  <>
                    <MetricItem label="Min. invest." value={`${asset.product.minAmount.toLocaleString()} ${asset.product.currency}`} color={PF.textSecondary} />
                    <MetricItem label="Devise" value={asset.product.currency} color={PF.textSecondary} />
                  </>
                )}
              </View>
            </PerfGlassCard>

            {/* Badges */}
            {(asset.shariaCompliant || asset.product?.taxAdvantaged) && (
              <View style={styles.badgesRow}>
                {asset.shariaCompliant && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>Sharia {'\u2713'}</Text>
                  </View>
                )}
                {asset.product?.taxAdvantaged && (
                  <View style={[styles.featureBadge, styles.taxBadge]}>
                    <Text style={[styles.featureBadgeText, styles.taxBadgeText]}>
                      Avantage fiscal {'\u2713'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function MetricItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricItemLabel}>{label}</Text>
      <Text style={[styles.metricItemValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1C23',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitleCol: {
    flex: 1,
    gap: 6,
  },
  headerTitle: {
    color: PF.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  pillarBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillarBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scroll: {
    marginBottom: 12,
  },
  section: {
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  descriptionText: {
    color: PF.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  narrationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  narrationBullet: {
    color: PF.blue,
    fontSize: 14,
    lineHeight: 20,
  },
  narrationText: {
    color: PF.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  totalScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  totalScoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '500',
    width: 100,
  },
  barTrackOuter: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  barScore: {
    fontSize: 11,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  metricItemLabel: {
    color: PF.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  metricItemValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  featureBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
  },
  featureBadgeText: {
    color: PF.green,
    fontSize: 12,
    fontWeight: '600',
  },
  taxBadge: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderColor: 'rgba(96,165,250,0.3)',
  },
  taxBadgeText: {
    color: PF.blue,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PF.border,
  },
  closeBtnText: {
    color: PF.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
