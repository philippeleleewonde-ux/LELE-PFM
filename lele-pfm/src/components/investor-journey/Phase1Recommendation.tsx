import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Sparkles, MapPin, Shield, Clock, ArrowRight } from 'lucide-react-native';
import { PF, PerfGlassCard, SectionHeader } from '@/components/performance/shared';
import { useInvestorJourney } from '@/hooks/useInvestorJourney';
import { useInvestmentStore } from '@/stores/investment-store';
import { useWizardStore } from '@/stores/wizard-store';
import { COUNTRY_RISK_PROFILES } from '@/constants/country-risk-profiles';
import { scoreProduct } from '@/domain/calculators/asset-recommender';
import { SelectedAsset, RecommendationScoreBreakdown } from '@/types/investor-journey';
import { JourneyProgressBar } from './JourneyProgressBar';
import { AssetCard } from './AssetCard';
import { AssetInfoSheet } from './AssetInfoSheet';

export function Phase1Recommendation() {
  const {
    currentPhase,
    recommendedAssets,
    countryProfile,
    ekhScore,
    canProceedToSelection,
    runRecommendation,
    goToPhase,
  } = useInvestorJourney();

  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const country = useWizardStore((s) => s.formData.country);
  const countryRiskProfile = COUNTRY_RISK_PROFILES[country];

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

  // Auto-run recommendation on mount if no assets yet
  useEffect(() => {
    if (recommendedAssets.length === 0) {
      runRecommendation();
    }
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <JourneyProgressBar currentPhase={currentPhase} />

      {/* Header */}
      <SectionHeader icon={Sparkles} title="Vos actifs recommandes" color={PF.accent} />

      {/* Profile badges */}
      <PerfGlassCard style={styles.profileCard}>
        <View style={styles.badgeRow}>
          {countryProfile && (
            <View style={styles.badge}>
              <MapPin size={12} color={PF.blue} />
              <Text style={styles.badgeText}>{countryProfile.name}</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Shield size={12} color={PF.accent} />
            <Text style={styles.badgeText}>EKH {ekhScore}/10</Text>
          </View>
          <View style={styles.badge}>
            <Clock size={12} color={PF.violet} />
            <Text style={styles.badgeText}>
              {recommendedAssets.length} actifs
            </Text>
          </View>
        </View>
        <Text style={styles.profileDesc}>
          Actifs selectionnes selon votre profil de risque, pays et score de litteratie financiere.
        </Text>
      </PerfGlassCard>

      {/* Asset list */}
      {recommendedAssets.length === 0 ? (
        <PerfGlassCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Completez votre profil investisseur pour recevoir des recommandations.
          </Text>
        </PerfGlassCard>
      ) : (
        <View style={styles.assetList}>
          {recommendedAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              showScore
              onInfo={handleOpenInfo}
            />
          ))}
        </View>
      )}

      {/* Continue button */}
      {canProceedToSelection && (
        <Pressable
          style={styles.continueBtn}
          onPress={() => goToPhase('selection')}
        >
          <Text style={styles.continueBtnText}>Continuer vers la selection</Text>
          <ArrowRight size={18} color="#0F1014" />
        </Pressable>
      )}

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
  profileCard: {
    padding: 14,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: PF.border,
  },
  badgeText: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  profileDesc: {
    color: PF.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: PF.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  assetList: {
    gap: 10,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PF.accent,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  continueBtnText: {
    color: '#0F1014',
    fontSize: 15,
    fontWeight: '700',
  },
});
