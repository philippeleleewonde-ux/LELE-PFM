import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { ListChecks, Plus, Zap, ArrowRight } from 'lucide-react-native';
import { PF, PerfGlassCard, SectionHeader } from '@/components/performance/shared';
import { PILLAR_CONFIG } from '@/constants/pillar-mapping';
import { useInvestorJourney } from '@/hooks/useInvestorJourney';
import { useInvestmentStore } from '@/stores/investment-store';
import { useWizardStore } from '@/stores/wizard-store';
import { COUNTRY_RISK_PROFILES } from '@/constants/country-risk-profiles';
import { scoreProduct } from '@/domain/calculators/asset-recommender';
import { InvestmentPillar } from '@/types/investment';
import { SelectedAsset, RecommendationScoreBreakdown } from '@/types/investor-journey';
import { JourneyProgressBar } from './JourneyProgressBar';
import { AssetCard } from './AssetCard';
import { AddCustomAssetModal } from './AddCustomAssetModal';
import { AssetInfoSheet } from './AssetInfoSheet';

export function Phase2Selection() {
  const {
    currentPhase,
    recommendedAssets,
    selectedAssets,
    acceptedAssets,
    canProceedToScenarios,
    acceptAsset,
    rejectAsset,
    updateAssetAllocation,
    generateAllStrategies,
    goToPhase,
  } = useInvestorJourney();

  const [showAddModal, setShowAddModal] = useState(false);

  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const country = useWizardStore((s) => s.formData.country);
  const countryRiskProfile = COUNTRY_RISK_PROFILES[country];
  const ekhScore = useMemo(() => {
    // Same logic as useInvestorJourney
    return 5; // Default; recalculated in the recommender
  }, []);

  const [selectedAssetForInfo, setSelectedAssetForInfo] = useState<SelectedAsset | null>(null);
  const [infoBreakdown, setInfoBreakdown] = useState<RecommendationScoreBreakdown | null>(null);

  const handleOpenInfo = useCallback((asset: SelectedAsset) => {
    let breakdown: RecommendationScoreBreakdown | null = null;
    if (asset.product && investorProfile) {
      breakdown = scoreProduct(
        asset.product,
        investorProfile,
        ekhScore,
        countryRiskProfile?.investmentInfraLevel ?? 2,
        { croissance: 0, amortisseur: 0, refuge: 0, base_arriere: 0 },
      );
    }
    setInfoBreakdown(breakdown);
    setSelectedAssetForInfo(asset);
  }, [investorProfile, ekhScore, countryRiskProfile]);

  // Allocation summary per pillar
  const pillarSummary = useMemo(() => {
    const summary: Record<InvestmentPillar, { total: number; color: string; label: string }> = {
      croissance: { total: 0, color: PILLAR_CONFIG.croissance.color, label: 'Croissance' },
      amortisseur: { total: 0, color: PILLAR_CONFIG.amortisseur.color, label: 'Amortisseur' },
      refuge: { total: 0, color: PILLAR_CONFIG.refuge.color, label: 'Refuge' },
      base_arriere: { total: 0, color: PILLAR_CONFIG.base_arriere.color, label: 'Base Arriere' },
    };

    for (const asset of acceptedAssets) {
      if (summary[asset.pillar]) {
        summary[asset.pillar].total += asset.allocationPercent;
      }
    }

    return summary;
  }, [acceptedAssets]);

  const totalAllocation = useMemo(() => {
    return acceptedAssets.reduce((sum, a) => sum + a.allocationPercent, 0);
  }, [acceptedAssets]);

  const handleGenerateStrategies = useCallback(() => {
    generateAllStrategies();
    goToPhase('scenarios');
  }, [generateAllStrategies, goToPhase]);

  // All displayable assets: merge recommended with selectedAssets state (for allocation updates)
  const displayAssets = useMemo(() => {
    const selectedMap = new Map(selectedAssets.map((a) => [a.id, a]));
    // Use selectedAssets version if available (has latest allocation/status), else recommendedAssets
    const merged = recommendedAssets.map((a) => selectedMap.get(a.id) ?? a);
    const recIds = new Set(recommendedAssets.map((a) => a.id));
    const customAssets = selectedAssets.filter((a) => a.isCustom && !recIds.has(a.id));
    return [...merged, ...customAssets];
  }, [recommendedAssets, selectedAssets]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <JourneyProgressBar currentPhase={currentPhase} />

      <SectionHeader icon={ListChecks} title="Selectionnez vos actifs" color={PF.accent} />

      {/* Asset cards with toggle */}
      <View style={styles.assetList}>
        {displayAssets.map((asset) => {
          const isAccepted = asset.status === 'accepted' || asset.status === 'custom';
          return (
            <View key={asset.id}>
              <AssetCard
                asset={asset}
                showToggle
                onAccept={acceptAsset}
                onReject={rejectAsset}
                onInfo={handleOpenInfo}
              />
              {/* Allocation slider for accepted assets */}
              {isAccepted && (
                <PerfGlassCard style={styles.allocationCard}>
                  <View style={styles.allocationRow}>
                    <Text style={styles.allocationLabel}>Allocation</Text>
                    <Text style={[styles.allocationValue, { color: PF.accent }]}>
                      {asset.allocationPercent}%
                    </Text>
                  </View>
                  {/* Slider track */}
                  <View style={styles.sliderTrack}>
                    <View
                      style={[
                        styles.sliderFill,
                        {
                          width: `${Math.min(100, asset.allocationPercent)}%`,
                          backgroundColor: PILLAR_CONFIG[asset.pillar].color,
                        },
                      ]}
                    />
                  </View>
                  {/* Quick percentage buttons */}
                  <View style={styles.quickBtns}>
                    {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                      <Pressable
                        key={pct}
                        style={[
                          styles.quickBtn,
                          asset.allocationPercent === pct && {
                            backgroundColor: PF.accent + '30',
                            borderColor: PF.accent,
                          },
                        ]}
                        onPress={() => updateAssetAllocation(asset.id, pct)}
                      >
                        <Text
                          style={[
                            styles.quickBtnText,
                            asset.allocationPercent === pct && { color: PF.accent },
                          ]}
                        >
                          {pct}%
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </PerfGlassCard>
              )}
            </View>
          );
        })}
      </View>

      {/* Add custom asset button */}
      <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
        <Plus size={16} color={PF.accent} />
        <Text style={styles.addBtnText}>Ajouter un actif</Text>
      </Pressable>

      {/* Allocation summary */}
      {acceptedAssets.length > 0 && (
        <PerfGlassCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Repartition par pilier</Text>

          {/* Pillar allocation circles */}
          <View style={styles.pillarGrid}>
            {(Object.entries(pillarSummary) as [InvestmentPillar, typeof pillarSummary.croissance][]).map(
              ([pillar, info]) => (
                <View key={pillar} style={styles.pillarItem}>
                  <View style={[styles.pillarCircle, { borderColor: info.color }]}>
                    <Text style={[styles.pillarPercent, { color: info.color }]}>
                      {info.total}%
                    </Text>
                  </View>
                  <Text style={styles.pillarLabel}>{info.label}</Text>
                </View>
              ),
            )}
          </View>

          {/* Total allocation */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total allocation</Text>
            <Text
              style={[
                styles.totalValue,
                {
                  color: totalAllocation === 100
                    ? PF.green
                    : totalAllocation > 100
                      ? PF.red
                      : PF.accent,
                },
              ]}
            >
              {totalAllocation}%
            </Text>
          </View>
          {totalAllocation !== 100 && (
            <Text style={styles.totalHint}>
              {totalAllocation < 100
                ? `Il reste ${100 - totalAllocation}% a allouer`
                : `Depassement de ${totalAllocation - 100}%`}
            </Text>
          )}
        </PerfGlassCard>
      )}

      {/* Generate strategies button */}
      <Pressable
        style={[
          styles.generateBtn,
          !canProceedToScenarios && styles.generateBtnDisabled,
        ]}
        onPress={handleGenerateStrategies}
        disabled={!canProceedToScenarios}
      >
        <Zap size={18} color={canProceedToScenarios ? '#0F1014' : PF.textMuted} />
        <Text
          style={[
            styles.generateBtnText,
            !canProceedToScenarios && styles.generateBtnTextDisabled,
          ]}
        >
          Generer les strategies
        </Text>
        <ArrowRight size={18} color={canProceedToScenarios ? '#0F1014' : PF.textMuted} />
      </Pressable>

      <AddCustomAssetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {selectedAssetForInfo && (
        <AssetInfoSheet
          visible={!!selectedAssetForInfo}
          onClose={() => setSelectedAssetForInfo(null)}
          asset={selectedAssetForInfo}
          scoreBreakdown={infoBreakdown}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  assetList: {
    gap: 10,
  },
  allocationCard: {
    padding: 12,
    marginTop: 4,
    gap: 8,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  allocationValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
  },
  quickBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  quickBtnText: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PF.accent + '40',
    borderStyle: 'dashed',
  },
  addBtnText: {
    color: PF.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 14,
    gap: 12,
  },
  summaryTitle: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pillarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pillarItem: {
    alignItems: 'center',
    gap: 6,
  },
  pillarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pillarPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  pillarLabel: {
    color: PF.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PF.border,
  },
  totalLabel: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  totalHint: {
    color: PF.textMuted,
    fontSize: 11,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PF.accent,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  generateBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  generateBtnText: {
    color: '#0F1014',
    fontSize: 15,
    fontWeight: '700',
  },
  generateBtnTextDisabled: {
    color: PF.textMuted,
  },
});
