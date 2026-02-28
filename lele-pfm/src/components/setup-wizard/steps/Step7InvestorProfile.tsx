import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions, TextInput } from 'react-native';
import { TrendingUp, Shield, Zap, Clock, Calendar, Hourglass, ShieldCheck, Heart, Ban, ShoppingCart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { WZ, GlassCard, FadeInView, PrimaryButton } from '../shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { useWizardStore } from '@/stores/wizard-store';
import { useEngineStore } from '@/stores/engine-store';
import { RiskTolerance, InvestmentHorizon, ShariaCompliance, AssetClass, BouclierLiquidite, StressReaction } from '@/types/investment';
import { recommendAllocation } from '@/domain/calculators/investment-simulator';

interface Props {
  isActive: boolean;
}

interface ChoiceCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  selected: boolean;
  color: string;
  onPress: () => void;
  compact?: boolean;
}

function ChoiceCard({ icon, label, description, selected, color, onPress, compact }: ChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choiceCard,
        compact && styles.choiceCardCompact,
        selected && { borderColor: color + '80', backgroundColor: color + '10' },
      ]}
    >
      <View style={[styles.choiceIcon, compact && styles.choiceIconCompact, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.choiceContent}>
        <Text style={[styles.choiceLabel, compact && styles.choiceLabelCompact, selected && { color }]}>
          {label}
        </Text>
        <Text style={[styles.choiceDesc, compact && styles.choiceDescCompact]}>{description}</Text>
      </View>
      {selected && <View style={[styles.activeDot, { backgroundColor: color }]} />}
    </Pressable>
  );
}

export default function Step7InvestorProfile({ isActive }: Props) {
  const { t } = useTranslation('wizard');
  const setInvestorProfile = useInvestmentStore((s) => s.setInvestorProfile);
  const setAllocations = useInvestmentStore((s) => s.setAllocations);
  const existingProfile = useInvestmentStore((s) => s.investorProfile);
  const { setStep, currentStep, formData } = useWizardStore();
  const engineOutput = useEngineStore((s) => s.engineOutput);

  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const isMedium = width < 400;

  const [risk, setRisk] = useState<RiskTolerance>(existingProfile?.riskTolerance ?? 'moderate');
  const [horizon, setHorizon] = useState<InvestmentHorizon>(existingProfile?.horizon ?? 'medium');
  const [sharia, setSharia] = useState<ShariaCompliance>(existingProfile?.shariaCompliance ?? 'not_required');
  const [investRatio, setInvestRatio] = useState(existingProfile?.investmentRatio ?? 20);
  const [bouclier, setBouclier] = useState<BouclierLiquidite>(existingProfile?.bouclierLiquidite ?? 'none');
  const [stressReaction, setStressReaction] = useState<StressReaction>(existingProfile?.stressReaction ?? 'hold');
  const [capitalInitial, setCapitalInitial] = useState(String(existingProfile?.capitalInitial ?? ''));

  const ratioOptions = [10, 15, 20, 25, 30, 35, 40];
  const iconSize = isSmall ? 16 : 20;

  const handleSave = () => {
    const profile = {
      riskTolerance: risk,
      horizon,
      shariaCompliance: sharia,
      monthlyInvestTarget: 0,
      investmentRatio: investRatio,
      preferredAssets: [] as AssetClass[],
      bouclierLiquidite: bouclier,
      stressReaction: stressReaction,
      capitalInitial: Number(capitalInitial) || 0,
    };
    setInvestorProfile(profile);

    // Auto-compute allocations from profile + country + engine
    const countryCode = formData?.country ?? 'CI';
    if (engineOutput) {
      const epr = engineOutput.step9.epr_n1;
      const monthlyBudget = epr * investRatio / 100 / 12;
      const allocs = recommendAllocation(profile, countryCode, monthlyBudget);
      setAllocations(allocs);
    }

    setStep(currentStep + 1);
  };

  const handleSkip = () => {
    setStep(currentStep + 1);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { padding: isSmall ? 16 : 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView active={isActive} delay={100}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13, marginTop: 12 }]}>
          {t('step7.riskTolerance')}
        </Text>
        <View style={styles.choices}>
          <ChoiceCard
            icon={<Shield size={iconSize} color="#4ADE80" />}
            label={t('step7.conservative')}
            description={t('step7.conservativeDesc')}
            selected={risk === 'conservative'}
            color="#4ADE80"
            onPress={() => setRisk('conservative')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<TrendingUp size={iconSize} color="#60A5FA" />}
            label={t('step7.moderate')}
            description={t('step7.moderateDesc')}
            selected={risk === 'moderate'}
            color="#60A5FA"
            onPress={() => setRisk('moderate')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Zap size={iconSize} color="#FBBF24" />}
            label={t('step7.aggressive')}
            description={t('step7.aggressiveDesc')}
            selected={risk === 'aggressive'}
            color="#FBBF24"
            onPress={() => setRisk('aggressive')}
            compact={isSmall}
          />
        </View>
      </FadeInView>

      <FadeInView active={isActive} delay={250}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>
          {t('step7.investmentHorizon')}
        </Text>
        <View style={styles.choices}>
          <ChoiceCard
            icon={<Clock size={iconSize} color="#FB923C" />}
            label={t('step7.shortTerm')}
            description={t('step7.shortTermDesc')}
            selected={horizon === 'short'}
            color="#FB923C"
            onPress={() => setHorizon('short')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Calendar size={iconSize} color="#A78BFA" />}
            label={t('step7.mediumTerm')}
            description={t('step7.mediumTermDesc')}
            selected={horizon === 'medium'}
            color="#A78BFA"
            onPress={() => setHorizon('medium')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Hourglass size={iconSize} color="#22D3EE" />}
            label={t('step7.longTerm')}
            description={t('step7.longTermDesc')}
            selected={horizon === 'long'}
            color="#22D3EE"
            onPress={() => setHorizon('long')}
            compact={isSmall}
          />
        </View>
      </FadeInView>

      <FadeInView active={isActive} delay={400}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>{t('step7.islamicFinance')}</Text>
        <View style={styles.choices}>
          <ChoiceCard
            icon={<Text style={{ fontSize: isSmall ? 14 : 18 }}>{'\u2713'}</Text>}
            label={t('step7.shariaRequired')}
            description={t('step7.shariaRequiredDesc')}
            selected={sharia === 'required'}
            color="#4ADE80"
            onPress={() => setSharia('required')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Text style={{ fontSize: isSmall ? 14 : 18 }}>{'\u2248'}</Text>}
            label={t('step7.shariaPreferred')}
            description={t('step7.shariaPreferredDesc')}
            selected={sharia === 'preferred'}
            color="#60A5FA"
            onPress={() => setSharia('preferred')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Text style={{ fontSize: isSmall ? 14 : 18 }}>{'\u00D7'}</Text>}
            label={t('step7.shariaNotRequired')}
            description={t('step7.shariaNotRequiredDesc')}
            selected={sharia === 'not_required'}
            color="#A1A1AA"
            onPress={() => setSharia('not_required')}
            compact={isSmall}
          />
        </View>
      </FadeInView>

      <FadeInView active={isActive} delay={550}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>
          {t('step7.investmentShare', { ratio: investRatio })}
        </Text>
        <GlassCard style={styles.ratioCard}>
          <View style={[styles.ratioRow, isMedium && { gap: 6 }]}>
            {ratioOptions.map((val) => (
              <Pressable
                key={val}
                onPress={() => setInvestRatio(val)}
                style={[
                  styles.ratioPill,
                  isMedium && styles.ratioPillCompact,
                  investRatio === val && styles.ratioPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.ratioPillText,
                    isMedium && { fontSize: 11 },
                    investRatio === val && styles.ratioPillTextActive,
                  ]}
                >
                  {val}%
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.ratioHint, isSmall && { fontSize: 10 }]}>
            {t('step7.ratioHint', { savings: 67 - investRatio, invest: investRatio })}
          </Text>
        </GlassCard>
      </FadeInView>

      <FadeInView active={isActive} delay={700}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>
          {t('step7.bouclierTitle')}
        </Text>
        <View style={styles.choices}>
          <ChoiceCard
            icon={<ShieldCheck size={iconSize} color="#4ADE80" />}
            label={t('step7.bouclierFull')}
            description={t('step7.bouclierFullDesc')}
            selected={bouclier === 'full'}
            color="#4ADE80"
            onPress={() => setBouclier('full')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Shield size={iconSize} color="#FBBF24" />}
            label={t('step7.bouclierPartial')}
            description={t('step7.bouclierPartialDesc')}
            selected={bouclier === 'partial'}
            color="#FBBF24"
            onPress={() => setBouclier('partial')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Ban size={iconSize} color="#F87171" />}
            label={t('step7.bouclierNone')}
            description={t('step7.bouclierNoneDesc')}
            selected={bouclier === 'none'}
            color="#F87171"
            onPress={() => setBouclier('none')}
            compact={isSmall}
          />
        </View>
      </FadeInView>

      <FadeInView active={isActive} delay={850}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>
          {t('step7.stressTitle')}
        </Text>
        <View style={styles.choices}>
          <ChoiceCard
            icon={<Ban size={iconSize} color="#F87171" />}
            label={t('step7.stressSellAll')}
            description={t('step7.stressSellAllDesc')}
            selected={stressReaction === 'sell_all'}
            color="#F87171"
            onPress={() => setStressReaction('sell_all')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<TrendingUp size={iconSize} color="#FB923C" />}
            label={t('step7.stressSellSome')}
            description={t('step7.stressSellSomeDesc')}
            selected={stressReaction === 'sell_some'}
            color="#FB923C"
            onPress={() => setStressReaction('sell_some')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Heart size={iconSize} color="#60A5FA" />}
            label={t('step7.stressHold')}
            description={t('step7.stressHoldDesc')}
            selected={stressReaction === 'hold'}
            color="#60A5FA"
            onPress={() => setStressReaction('hold')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<ShoppingCart size={iconSize} color="#4ADE80" />}
            label={t('step7.stressBuyMore')}
            description={t('step7.stressBuyMoreDesc')}
            selected={stressReaction === 'buy_more'}
            color="#4ADE80"
            onPress={() => setStressReaction('buy_more')}
            compact={isSmall}
          />
        </View>
      </FadeInView>

      <FadeInView active={isActive} delay={1000}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>
          {t('step7.capitalTitle')}
        </Text>
        <TextInput
          style={styles.capitalInput}
          value={capitalInitial}
          onChangeText={setCapitalInitial}
          placeholder={t('step7.capitalPlaceholder')}
          placeholderTextColor="#52525B"
          keyboardType="numeric"
        />
      </FadeInView>

      <FadeInView active={isActive} delay={1150}>
        <View style={[styles.buttons, isSmall && { marginTop: 16 }]}>
          <PrimaryButton label={t('step7.validateProfile')} onPress={handleSave} />
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('step7.skipStep')}</Text>
          </Pressable>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  sectionTitle: {
    color: WZ.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 20,
  },
  choices: { gap: 8 },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WZ.cardBorder,
    backgroundColor: WZ.cardBg,
  },
  choiceCardCompact: {
    padding: 10,
    borderRadius: 12,
  },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  choiceIconCompact: {
    width: 32,
    height: 32,
    borderRadius: 10,
    marginRight: 10,
  },
  choiceContent: { flex: 1 },
  choiceLabel: { color: WZ.textPrimary, fontSize: 14, fontWeight: '700' },
  choiceLabelCompact: { fontSize: 13 },
  choiceDesc: { color: WZ.textMuted, fontSize: 11, marginTop: 2 },
  choiceDescCompact: { fontSize: 10 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  ratioCard: { marginTop: 4 },
  ratioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratioPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: WZ.cardBorder,
    backgroundColor: WZ.cardBg,
  },
  ratioPillCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ratioPillActive: {
    borderColor: '#FBBF2480',
    backgroundColor: '#FBBF2415',
  },
  ratioPillText: { color: WZ.textSecondary, fontSize: 13, fontWeight: '600' },
  ratioPillTextActive: { color: '#FBBF24' },
  ratioHint: {
    color: WZ.textMuted,
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
  capitalInput: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  buttons: { marginTop: 24, gap: 12 },
  skipButton: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: WZ.textMuted, fontSize: 14, fontWeight: '600' },
});
