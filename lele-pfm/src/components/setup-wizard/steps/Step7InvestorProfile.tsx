import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { TrendingUp, Shield, Zap, Clock, Calendar, Hourglass } from 'lucide-react-native';
import { WZ, GlassCard, FadeInView, PrimaryButton } from '../shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { useWizardStore } from '@/stores/wizard-store';
import { useEngineStore } from '@/stores/engine-store';
import { RiskTolerance, InvestmentHorizon, ShariaCompliance, AssetClass } from '@/types/investment';
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
          Tolérance au risque
        </Text>
        <View style={styles.choices}>
          <ChoiceCard
            icon={<Shield size={iconSize} color="#4ADE80" />}
            label="Prudent"
            description="Capital garanti, rendement modéré"
            selected={risk === 'conservative'}
            color="#4ADE80"
            onPress={() => setRisk('conservative')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<TrendingUp size={iconSize} color="#60A5FA" />}
            label="Équilibré"
            description="Mix sécurité et performance"
            selected={risk === 'moderate'}
            color="#60A5FA"
            onPress={() => setRisk('moderate')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Zap size={iconSize} color="#FBBF24" />}
            label="Dynamique"
            description="Rendement élevé, volatilité acceptée"
            selected={risk === 'aggressive'}
            color="#FBBF24"
            onPress={() => setRisk('aggressive')}
            compact={isSmall}
          />
        </View>
      </FadeInView>

      <FadeInView active={isActive} delay={250}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>
          Horizon d'investissement
        </Text>
        <View style={styles.choices}>
          <ChoiceCard
            icon={<Clock size={iconSize} color="#FB923C" />}
            label="Court terme"
            description="Moins de 2 ans"
            selected={horizon === 'short'}
            color="#FB923C"
            onPress={() => setHorizon('short')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Calendar size={iconSize} color="#A78BFA" />}
            label="Moyen terme"
            description="2 à 5 ans"
            selected={horizon === 'medium'}
            color="#A78BFA"
            onPress={() => setHorizon('medium')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Hourglass size={iconSize} color="#22D3EE" />}
            label="Long terme"
            description="Plus de 5 ans"
            selected={horizon === 'long'}
            color="#22D3EE"
            onPress={() => setHorizon('long')}
            compact={isSmall}
          />
        </View>
      </FadeInView>

      <FadeInView active={isActive} delay={400}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>Finance islamique</Text>
        <View style={styles.choices}>
          <ChoiceCard
            icon={<Text style={{ fontSize: isSmall ? 14 : 18 }}>{'\u2713'}</Text>}
            label="Obligatoire"
            description="Uniquement des produits conformes"
            selected={sharia === 'required'}
            color="#4ADE80"
            onPress={() => setSharia('required')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Text style={{ fontSize: isSmall ? 14 : 18 }}>{'\u2248'}</Text>}
            label="Préféré"
            description="Privilégier si possible"
            selected={sharia === 'preferred'}
            color="#60A5FA"
            onPress={() => setSharia('preferred')}
            compact={isSmall}
          />
          <ChoiceCard
            icon={<Text style={{ fontSize: isSmall ? 14 : 18 }}>{'\u00D7'}</Text>}
            label="Indifférent"
            description="Tous les produits"
            selected={sharia === 'not_required'}
            color="#A1A1AA"
            onPress={() => setSharia('not_required')}
            compact={isSmall}
          />
        </View>
      </FadeInView>

      <FadeInView active={isActive} delay={550}>
        <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>
          Part investissement ({investRatio}%)
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
            Épargne {67 - investRatio}% · Investissement {investRatio}% · Plaisir 33%
          </Text>
        </GlassCard>
      </FadeInView>

      <FadeInView active={isActive} delay={700}>
        <View style={[styles.buttons, isSmall && { marginTop: 16 }]}>
          <PrimaryButton label="Valider mon profil" onPress={handleSave} />
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Passer cette étape</Text>
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
  buttons: { marginTop: 24, gap: 12 },
  skipButton: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: WZ.textMuted, fontSize: 14, fontWeight: '600' },
});
