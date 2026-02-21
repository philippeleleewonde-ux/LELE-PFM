import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { WZ, GlassCard, FadeInView, neonGlow } from '../shared';
import { useWizardStore } from '@/stores/wizard-store';

interface Props {
  isActive: boolean;
}

interface RiskDomain {
  key: string;
  label: string;
  description: string;
}

const RISK_DOMAINS: RiskDomain[] = [
  { key: 'emploi', label: 'Emploi', description: 'Stabilité professionnelle' },
  { key: 'logement', label: 'Logement', description: 'Situation immobilière' },
  { key: 'sante', label: 'Santé', description: 'Couverture et frais médicaux' },
  { key: 'endettement', label: 'Endettement', description: 'Niveau d\'endettement' },
  { key: 'epargne', label: 'Épargne', description: 'Capacité d\'épargne' },
  { key: 'juridique', label: 'Juridique', description: 'Exposition juridique' },
];

function getRiskLabel(value: number): { text: string; color: string } {
  if (value <= 33) return { text: 'Stable', color: WZ.green };
  if (value <= 66) return { text: 'Modéré', color: WZ.orange };
  return { text: 'À surveiller', color: WZ.red };
}

export default function Step4Risks({ isActive }: Props) {
  const { formData, updateFormData } = useWizardStore();
  const risks = formData.risks;

  const handleChange = useCallback((key: string, value: number) => {
    updateFormData({
      risks: { ...risks, [key]: Math.round(value) },
    });
  }, [risks, updateFormData]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView active={isActive} delay={0}>
        <Text style={styles.title}>Évaluation des risques</Text>
        <Text style={styles.subtitle}>
          Évaluez votre niveau d'exposition pour chaque domaine
        </Text>
      </FadeInView>

      {RISK_DOMAINS.map((domain, index) => {
        const value = risks[domain.key] ?? 0;
        const riskInfo = getRiskLabel(value);

        return (
          <FadeInView key={domain.key} active={isActive} delay={100 + index * 80}>
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.shieldIcon}>🛡️</Text>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.domainName}>{domain.label}</Text>
                  <Text style={styles.domainDesc}>{domain.description}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: riskInfo.color + '22' }]}>
                  <Text style={[styles.badgeText, { color: riskInfo.color, ...neonGlow(riskInfo.color) }]}>
                    {riskInfo.text}
                  </Text>
                </View>
              </View>

              <View style={styles.sliderRow}>
                <Text style={styles.sliderMin}>0</Text>
                <View style={styles.sliderWrap}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    value={value}
                    onValueChange={(v: number) => handleChange(domain.key, v)}
                    minimumTrackTintColor={riskInfo.color}
                    maximumTrackTintColor={WZ.border}
                    thumbTintColor={riskInfo.color}
                  />
                </View>
                <Text style={styles.sliderMax}>100</Text>
              </View>

              <View style={styles.valueRow}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${value}%`, backgroundColor: riskInfo.color },
                    ]}
                  />
                </View>
                <Text style={[styles.valueText, { color: riskInfo.color, ...neonGlow(riskInfo.color) }]}>
                  {value}
                </Text>
              </View>
            </GlassCard>
          </FadeInView>
        );
      })}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WZ.darkBg,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: WZ.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: WZ.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shieldIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitleWrap: {
    flex: 1,
  },
  domainName: {
    fontSize: 17,
    fontWeight: '700',
    color: WZ.textPrimary,
  },
  domainDesc: {
    fontSize: 13,
    color: WZ.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderWrap: {
    flex: 1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderMin: {
    fontSize: 12,
    color: WZ.textMuted,
    width: 20,
    textAlign: 'center',
  },
  sliderMax: {
    fontSize: 12,
    color: WZ.textMuted,
    width: 28,
    textAlign: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: WZ.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '800',
    width: 32,
    textAlign: 'right',
  },
  bottomSpacer: {
    height: 40,
  },
});
