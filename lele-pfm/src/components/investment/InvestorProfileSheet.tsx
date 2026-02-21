import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { X, TrendingUp, Shield, Zap, Clock, Calendar, Hourglass } from 'lucide-react-native';
import { useInvestmentStore } from '@/stores/investment-store';
import { useWizardStore } from '@/stores/wizard-store';
import { useEngineStore } from '@/stores/engine-store';
import { RiskTolerance, InvestmentHorizon, ShariaCompliance, AssetClass } from '@/types/investment';
import { recommendAllocation } from '@/domain/calculators/investment-simulator';

interface Props {
  visible: boolean;
  onClose: () => void;
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

export function InvestorProfileSheet({ visible, onClose }: Props) {
  const setInvestorProfile = useInvestmentStore((s) => s.setInvestorProfile);
  const setAllocations = useInvestmentStore((s) => s.setAllocations);
  const existingProfile = useInvestmentStore((s) => s.investorProfile);
  const countryCode = useWizardStore((s) => s.formData.country);
  const engineOutput = useEngineStore((s) => s.engineOutput);

  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const isMedium = width < 400;

  const [risk, setRisk] = useState<RiskTolerance>(existingProfile?.riskTolerance ?? 'moderate');
  const [horizon, setHorizon] = useState<InvestmentHorizon>(existingProfile?.horizon ?? 'medium');
  const [sharia, setSharia] = useState<ShariaCompliance>(existingProfile?.shariaCompliance ?? 'not_required');
  const [investRatio, setInvestRatio] = useState(existingProfile?.investmentRatio ?? 20);

  // Sync with existing profile when modal opens
  useEffect(() => {
    if (visible && existingProfile) {
      setRisk(existingProfile.riskTolerance);
      setHorizon(existingProfile.horizon);
      setSharia(existingProfile.shariaCompliance);
      setInvestRatio(existingProfile.investmentRatio);
    }
  }, [visible, existingProfile]);

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
    if (engineOutput) {
      const epr = engineOutput.step9.epr_n1;
      const monthlyBudget = epr * investRatio / 100 / 12;
      const allocs = recommendAllocation(profile, countryCode, monthlyBudget);
      setAllocations(allocs);
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { maxHeight: height * (isSmall ? 0.95 : 0.92) }]}>
          {/* Header */}
          <View style={[styles.header, isSmall && { paddingHorizontal: 12, paddingTop: 12 }]}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={[styles.title, isSmall && { fontSize: 16 }]}>Profil investisseur</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={isSmall ? 18 : 20} color="#A1A1AA" />
              </Pressable>
            </View>
            <Text style={[styles.subtitle, isSmall && { fontSize: 11 }]}>
              Configurez votre profil pour recevoir des recommandations personnalisées
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { padding: isSmall ? 12 : isMedium ? 16 : 20 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Risk Tolerance */}
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

            {/* Horizon */}
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

            {/* Sharia */}
            <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>Finance islamique</Text>
            <View style={styles.choices}>
              <ChoiceCard
                icon={<Text style={{ fontSize: isSmall ? 14 : 18, color: '#4ADE80' }}>{'\u2713'}</Text>}
                label="Obligatoire"
                description="Uniquement des produits conformes"
                selected={sharia === 'required'}
                color="#4ADE80"
                onPress={() => setSharia('required')}
                compact={isSmall}
              />
              <ChoiceCard
                icon={<Text style={{ fontSize: isSmall ? 14 : 18, color: '#60A5FA' }}>{'\u2248'}</Text>}
                label="Préféré"
                description="Privilégier si possible"
                selected={sharia === 'preferred'}
                color="#60A5FA"
                onPress={() => setSharia('preferred')}
                compact={isSmall}
              />
              <ChoiceCard
                icon={<Text style={{ fontSize: isSmall ? 14 : 18, color: '#A1A1AA' }}>{'\u00D7'}</Text>}
                label="Indifférent"
                description="Tous les produits"
                selected={sharia === 'not_required'}
                color="#A1A1AA"
                onPress={() => setSharia('not_required')}
                compact={isSmall}
              />
            </View>

            {/* Investment Ratio */}
            <Text style={[styles.sectionTitle, isSmall && { fontSize: 13 }]}>
              Part investissement ({investRatio}%)
            </Text>
            <View style={[styles.ratioCard, isSmall && { padding: 12 }]}>
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
            </View>

            {/* Save Button */}
            <Pressable onPress={handleSave} style={[styles.saveButton, isSmall && { paddingVertical: 14 }]}>
              <Text style={[styles.saveText, isSmall && { fontSize: 14 }]}>Valider mon profil</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#71717A',
    fontSize: 13,
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#E4E4E7',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 20,
  },
  choices: {
    gap: 8,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  choiceCardCompact: {
    padding: 10,
    borderRadius: 12,
  },
  choiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  choiceIconCompact: {
    width: 30,
    height: 30,
    borderRadius: 8,
    marginRight: 8,
  },
  choiceContent: {
    flex: 1,
  },
  choiceLabel: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '700',
  },
  choiceLabelCompact: {
    fontSize: 13,
  },
  choiceDesc: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  choiceDescCompact: {
    fontSize: 10,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ratioCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: 4,
  },
  ratioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratioPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  ratioPillCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ratioPillActive: {
    borderColor: '#FBBF2480',
    backgroundColor: '#FBBF2415',
  },
  ratioPillText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '600',
  },
  ratioPillTextActive: {
    color: '#FBBF24',
  },
  ratioHint: {
    color: '#52525B',
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 28,
    backgroundColor: '#FBBF24',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#0F1014',
    fontSize: 16,
    fontWeight: '700',
  },
});
