import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, X, FileText, Info } from 'lucide-react-native';
import { PF, PerfGlassCard } from '@/components/performance/shared';
import { PILLAR_CONFIG } from '@/constants/pillar-mapping';
import { SelectedAsset } from '@/types/investor-journey';

const PILLAR_EMOJI: Record<string, string> = {
  croissance: '🚀',
  amortisseur: '🛡️',
  refuge: '🏛️',
  base_arriere: '🔒',
};

const LIQUIDITY_LABELS: Record<string, string> = {
  immediate: 'Immediat',
  days: 'Quelques jours',
  weeks: 'Quelques semaines',
  months: 'Quelques mois',
  locked: 'Bloque',
};

interface AssetCardProps {
  asset: SelectedAsset;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onInfo?: (asset: SelectedAsset) => void;
  showToggle?: boolean;
  showScore?: boolean;
  procedureStepCount?: number;
  onViewProcedure?: (id: string) => void;
}

export function AssetCard({
  asset,
  onAccept,
  onReject,
  onInfo,
  showToggle = false,
  showScore = false,
  procedureStepCount,
  onViewProcedure,
}: AssetCardProps) {
  const pillarConfig = PILLAR_CONFIG[asset.pillar];
  const isAccepted = asset.status === 'accepted' || asset.status === 'custom';
  const isRejected = asset.status === 'rejected';

  return (
    <PerfGlassCard style={styles.card}>
      {/* Header row: emoji + name + pillar badge */}
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: pillarConfig.color + '20' }]}>
          <Text style={styles.emoji}>{PILLAR_EMOJI[asset.pillar] ?? '📊'}</Text>
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.name} numberOfLines={1}>{asset.name}</Text>
          <Text style={styles.assetClass}>{formatAssetClass(asset.assetClass)}</Text>
        </View>
        <View style={[styles.pillarBadge, { backgroundColor: pillarConfig.color + '20', borderColor: pillarConfig.color + '40' }]}>
          <Text style={[styles.pillarBadgeText, { color: pillarConfig.color }]}>
            {PILLAR_EMOJI[asset.pillar]}
          </Text>
        </View>
        {onInfo && (
          <Pressable
            style={styles.infoBtn}
            onPress={() => onInfo(asset)}
            hitSlop={6}
          >
            <Info size={16} color={PF.blue} />
          </Pressable>
        )}
      </View>

      {/* Metrics row */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Rendement</Text>
          <Text style={[styles.metricValue, { color: PF.green }]}>
            {asset.expectedReturnRate}%
          </Text>
        </View>
        <View style={styles.metricSep} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Risque</Text>
          <View style={styles.riskDots}>
            {[1, 2, 3, 4, 5].map((level) => (
              <View
                key={level}
                style={[
                  styles.riskDot,
                  {
                    backgroundColor:
                      level <= asset.riskLevel
                        ? level <= 2
                          ? PF.green
                          : level <= 3
                            ? PF.accent
                            : PF.red
                        : 'rgba(255,255,255,0.1)',
                  },
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.metricSep} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Liquidite</Text>
          <Text style={styles.metricValueSmall}>{LIQUIDITY_LABELS[asset.liquidity] ?? asset.liquidity}</Text>
        </View>
      </View>

      {/* Score badge (optional) */}
      {showScore && asset.recommendationScore != null && (
        <View style={styles.scoreRow}>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(asset.recommendationScore) + '20', borderColor: getScoreColor(asset.recommendationScore) + '60' }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(asset.recommendationScore) }]}>
              Score: {asset.recommendationScore}/100
            </Text>
          </View>
          {asset.shariaCompliant && (
            <View style={[styles.shariaBadge]}>
              <Text style={styles.shariaText}>Sharia ✓</Text>
            </View>
          )}
        </View>
      )}

      {/* Procedure link (optional) */}
      {procedureStepCount != null && procedureStepCount > 0 && onViewProcedure && (
        <Pressable
          style={styles.procedureBtn}
          onPress={() => onViewProcedure(asset.id)}
        >
          <FileText size={14} color={PF.accent} />
          <Text style={styles.procedureBtnText}>
            Voir les etapes ({procedureStepCount})
          </Text>
        </Pressable>
      )}

      {/* Accept / Reject toggles (optional) */}
      {showToggle && (
        <View style={styles.toggleRow}>
          <Pressable
            style={[
              styles.toggleBtn,
              isAccepted && styles.toggleBtnActive,
              isAccepted && { borderColor: PF.green },
            ]}
            onPress={() => onAccept?.(asset.id)}
          >
            <Check size={16} color={isAccepted ? PF.green : PF.textMuted} />
            <Text style={[styles.toggleText, isAccepted && { color: PF.green }]}>
              Accepter
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleBtn,
              isRejected && styles.toggleBtnActive,
              isRejected && { borderColor: PF.red },
            ]}
            onPress={() => onReject?.(asset.id)}
          >
            <X size={16} color={isRejected ? PF.red : PF.textMuted} />
            <Text style={[styles.toggleText, isRejected && { color: PF.red }]}>
              Rejeter
            </Text>
          </Pressable>
        </View>
      )}
    </PerfGlassCard>
  );
}

function formatAssetClass(cls: string): string {
  return cls
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getScoreColor(score: number): string {
  if (score >= 75) return PF.green;
  if (score >= 50) return PF.accent;
  if (score >= 30) return PF.orange;
  return PF.red;
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  titleCol: {
    flex: 1,
  },
  name: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  assetClass: {
    color: PF.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  pillarBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillarBadgeText: {
    fontSize: 12,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricSep: {
    width: 1,
    height: 24,
    backgroundColor: PF.border,
  },
  metricLabel: {
    color: PF.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricValueSmall: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  riskDots: {
    flexDirection: 'row',
    gap: 3,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  shariaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
  },
  shariaText: {
    color: PF.green,
    fontSize: 10,
    fontWeight: '600',
  },
  procedureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: PF.accent + '15',
  },
  procedureBtnText: {
    color: PF.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  toggleText: {
    color: PF.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
