import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Shuffle, ChevronDown, ChevronUp, Globe, MapPin, Briefcase, Users, Banknote } from 'lucide-react-native';
import { useWizardStore } from '@/stores/wizard-store';
import { WZ, GlassCard, TipBox, FadeInView, neonGlow } from '../shared';
import { generateDemoData } from '@/services/demo-data-generator';
import { COUNTRY_RISK_PROFILES } from '@/constants/country-risk-profiles';

// ─── Country → Currency mapping ───

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  CI: 'FCFA', SN: 'FCFA', ML: 'FCFA', BF: 'FCFA', NE: 'FCFA', TG: 'FCFA', BJ: 'FCFA', GW: 'FCFA',
  CM: 'FCFA', GA: 'FCFA', CG: 'FCFA', TD: 'FCFA', CF: 'FCFA', GQ: 'FCFA',
  FR: 'EUR', BE: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR',
  CH: 'CHF', GB: 'GBP',
  MA: 'MAD', TN: 'TND', DZ: 'DZD',
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR',
  CD: 'CDF', GN: 'GNF', RW: 'RWF', ET: 'ETB', TZ: 'TZS',
  US: 'USD', CA: 'CAD', BR: 'BRL', MX: 'MXN', HT: 'HTG',
  IN: 'INR', CN: 'CNY', JP: 'JPY', VN: 'VND', PH: 'PHP', BD: 'BDT', PK: 'PKR',
  LB: 'LBP', AE: 'AED', SA: 'SAR',
};

// ─── Constants (keys only — labels come from i18n) ───

const PROFILE_KEYS = [
  'salarie', 'independant', 'fonctionnaire', 'etudiant', 'retraite', 'entrepreneur',
  'interimaire', 'autoEntrepreneur', 'sansEmploi', 'cadre', 'professionLiberale', 'agriculteur',
] as const;

const SITUATION_KEYS = [
  'celibataire', 'enCouple', 'pacse', 'marie', 'separe', 'divorce', 'veuf',
] as const;

// ─── Component ───

interface Step1ProfileProps {
  isActive: boolean;
}

export default function Step1Profile({ isActive }: Step1ProfileProps) {
  const { formData, updateFormData } = useWizardStore();
  const { t } = useTranslation('wizard');
  const [countryOpen, setCountryOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const selectedJob = formData.job;
  const selectedSituation = formData.situation;
  const age = formData.age;
  const dependents = formData.dependents;
  const selectedCountry = formData.country || 'CI';
  const selectedUrbanRural = formData.urbanRural || 'urban';
  const selectedIncomeSource = formData.incomeSource || 'formal';
  const extendedFamily = formData.extendedFamilyObligations ?? false;

  // ─── Arrays that depend on t() ───

  const CURRENCIES = [
    { code: 'FCFA', label: t('step1.currencies.FCFA') },
    { code: 'EUR', label: t('step1.currencies.EUR') },
    { code: 'USD', label: t('step1.currencies.USD') },
    { code: 'GBP', label: t('step1.currencies.GBP') },
    { code: 'CHF', label: t('step1.currencies.CHF') },
    { code: 'MAD', label: t('step1.currencies.MAD') },
    { code: 'TND', label: t('step1.currencies.TND') },
    { code: 'DZD', label: t('step1.currencies.DZD') },
    { code: 'NGN', label: t('step1.currencies.NGN') },
    { code: 'GHS', label: t('step1.currencies.GHS') },
    { code: 'KES', label: t('step1.currencies.KES') },
    { code: 'ZAR', label: t('step1.currencies.ZAR') },
    { code: 'CDF', label: t('step1.currencies.CDF') },
    { code: 'GNF', label: t('step1.currencies.GNF') },
    { code: 'CAD', label: t('step1.currencies.CAD') },
    { code: 'BRL', label: t('step1.currencies.BRL') },
    { code: 'INR', label: t('step1.currencies.INR') },
    { code: 'HTG', label: t('step1.currencies.HTG') },
  ];

  const COUNTRY_GROUPS: Array<{ label: string; codes: string[] }> = [
    { label: t('step1.countryGroups.westAfrica'), codes: ['CI', 'SN', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GW'] },
    { label: t('step1.countryGroups.centralAfrica'), codes: ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ'] },
    { label: t('step1.countryGroups.otherAfrica'), codes: ['NG', 'GH', 'KE', 'ZA', 'CD', 'GN', 'ET', 'TZ', 'RW'] },
    { label: t('step1.countryGroups.maghreb'), codes: ['MA', 'TN', 'DZ'] },
    { label: t('step1.countryGroups.europe'), codes: ['FR', 'BE', 'CH', 'DE', 'GB', 'IT', 'ES', 'PT'] },
    { label: t('step1.countryGroups.americas'), codes: ['US', 'CA', 'BR', 'MX', 'HT'] },
    { label: t('step1.countryGroups.asiaMiddleEast'), codes: ['IN', 'CN', 'JP', 'VN', 'PH', 'BD', 'PK', 'LB', 'AE', 'SA'] },
  ];

  const URBAN_RURAL_OPTIONS = [
    { key: 'urban' as const, label: t('step1.urbanRural.urban'), icon: '🏙️' },
    { key: 'rural' as const, label: t('step1.urbanRural.rural'), icon: '🌾' },
  ];

  const INCOME_SOURCE_OPTIONS = [
    { key: 'formal' as const, label: t('step1.incomeSources.formal'), desc: t('step1.incomeSources.formalDesc') },
    { key: 'mixed' as const, label: t('step1.incomeSources.mixed'), desc: t('step1.incomeSources.mixedDesc') },
    { key: 'informal' as const, label: t('step1.incomeSources.informal'), desc: t('step1.incomeSources.informalDesc') },
    { key: 'seasonal' as const, label: t('step1.incomeSources.seasonal'), desc: t('step1.incomeSources.seasonalDesc') },
  ];

  const selectedCurrency = formData.currency || COUNTRY_TO_CURRENCY[selectedCountry] || 'FCFA';
  const currencyLabel = CURRENCIES.find((c) => c.code === selectedCurrency)?.label ?? selectedCurrency;

  const countryName = COUNTRY_RISK_PROFILES[selectedCountry]?.name ?? selectedCountry;

  const handleGenerateDemo = () => {
    const demoData = generateDemoData();
    updateFormData(demoData);
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Demo Data Button ── */}
      <FadeInView active={isActive} delay={0}>
        <Pressable
          onPress={handleGenerateDemo}
          style={({ pressed }) => [styles.demoButton, pressed && styles.demoButtonPressed]}
        >
          <Shuffle size={16} color="#D9A11B" />
          <Text style={styles.demoButtonText}>{t('step1.demoButton')}</Text>
        </Pressable>
      </FadeInView>

      {/* ── Professional Profile ── */}
      <FadeInView active={isActive} delay={0}>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('step1.professionalProfile')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('step1.selectProfession')}
          </Text>

          <View style={styles.profileGrid}>
            {PROFILE_KEYS.map((key) => {
              const isSelected = selectedJob === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => updateFormData({ job: key })}
                  style={[
                    styles.profileButton,
                    isSelected && styles.profileButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.profileButtonText,
                      isSelected && styles.profileButtonTextSelected,
                    ]}
                  >
                    {t(`step1.profiles.${key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>
      </FadeInView>

      {/* ── Family Situation ── */}
      <FadeInView active={isActive} delay={100}>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('step1.familySituation')}</Text>

          <View style={styles.situationRow}>
            {SITUATION_KEYS.map((key) => {
              const isSelected = selectedSituation === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => updateFormData({ situation: key })}
                  style={[
                    styles.situationButton,
                    isSelected && styles.situationButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.situationButtonText,
                      isSelected && styles.situationButtonTextSelected,
                    ]}
                  >
                    {t(`step1.situations.${key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>
      </FadeInView>

      {/* ── Age & Dependents ── */}
      <FadeInView active={isActive} delay={200}>
        <GlassCard style={styles.section}>
          <View style={styles.inputRow}>
            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('step1.age')}</Text>
              <TextInput
                style={styles.textInput}
                value={age}
                onChangeText={(value) => updateFormData({ age: value })}
                placeholder={t('step1.agePlaceholder')}
                placeholderTextColor={WZ.textMuted}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Dependents */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('step1.dependents')}</Text>
              <TextInput
                style={styles.textInput}
                value={dependents}
                onChangeText={(value) => updateFormData({ dependents: value })}
                placeholder={t('step1.dependentsPlaceholder')}
                placeholderTextColor={WZ.textMuted}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          </View>
        </GlassCard>
      </FadeInView>

      {/* ── Country ── */}
      <FadeInView active={isActive} delay={300}>
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={18} color={WZ.accent} />
            <Text style={styles.sectionTitle}>{t('step1.countryOfResidence')}</Text>
          </View>

          <Pressable
            onPress={() => setCountryOpen(!countryOpen)}
            style={styles.countrySelector}
          >
            <Text style={styles.countrySelectorText}>{countryName}</Text>
            {countryOpen
              ? <ChevronUp size={18} color={WZ.textSecondary} />
              : <ChevronDown size={18} color={WZ.textSecondary} />
            }
          </Pressable>

          {countryOpen && (
            <View style={styles.countryList}>
              {COUNTRY_GROUPS.map((group) => (
                <View key={group.label}>
                  <Text style={styles.countryGroupLabel}>{group.label}</Text>
                  <View style={styles.countryGrid}>
                    {group.codes.map((code) => {
                      const profile = COUNTRY_RISK_PROFILES[code];
                      if (!profile) return null;
                      const isSelected = selectedCountry === code;
                      return (
                        <Pressable
                          key={code}
                          onPress={() => {
                            const autoCurrency = COUNTRY_TO_CURRENCY[code] ?? 'FCFA';
                            updateFormData({ country: code, currency: autoCurrency });
                            setCountryOpen(false);
                          }}
                          style={[
                            styles.countryButton,
                            isSelected && styles.countryButtonSelected,
                          ]}
                        >
                          <Text style={[
                            styles.countryButtonText,
                            isSelected && styles.countryButtonTextSelected,
                          ]}>
                            {profile.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      </FadeInView>

      {/* ── Currency ── */}
      <FadeInView active={isActive} delay={325}>
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Banknote size={18} color={WZ.gold} />
            <Text style={styles.sectionTitle}>{t('step1.currency')}</Text>
          </View>

          <Pressable
            onPress={() => setCurrencyOpen(!currencyOpen)}
            style={styles.countrySelector}
          >
            <Text style={styles.countrySelectorText}>{selectedCurrency} — {currencyLabel}</Text>
            {currencyOpen
              ? <ChevronUp size={18} color={WZ.textSecondary} />
              : <ChevronDown size={18} color={WZ.textSecondary} />
            }
          </Pressable>

          {currencyOpen && (
            <View style={styles.countryGrid}>
              {CURRENCIES.map((cur) => {
                const isSelected = selectedCurrency === cur.code;
                return (
                  <Pressable
                    key={cur.code}
                    onPress={() => {
                      updateFormData({ currency: cur.code });
                      setCurrencyOpen(false);
                    }}
                    style={[
                      styles.countryButton,
                      isSelected && styles.countryButtonSelected,
                    ]}
                  >
                    <Text style={[
                      styles.countryButtonText,
                      isSelected && styles.countryButtonTextSelected,
                    ]}>
                      {cur.code}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </GlassCard>
      </FadeInView>

      {/* ── Urban / Rural ── */}
      <FadeInView active={isActive} delay={350}>
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={WZ.neonLime} />
            <Text style={styles.sectionTitle}>{t('step1.residenceZone')}</Text>
          </View>

          <View style={styles.toggleRow}>
            {URBAN_RURAL_OPTIONS.map((opt) => {
              const isSelected = selectedUrbanRural === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => updateFormData({ urbanRural: opt.key })}
                  style={[styles.toggleButton, isSelected && styles.toggleButtonSelected]}
                >
                  <Text style={styles.toggleIcon}>{opt.icon}</Text>
                  <Text style={[
                    styles.toggleButtonText,
                    isSelected && styles.toggleButtonTextSelected,
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>
      </FadeInView>

      {/* ── Income Source ── */}
      <FadeInView active={isActive} delay={400}>
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Briefcase size={18} color={WZ.gold} />
            <Text style={styles.sectionTitle}>{t('step1.mainIncomeSource')}</Text>
          </View>

          <View style={styles.incomeSourceGrid}>
            {INCOME_SOURCE_OPTIONS.map((opt) => {
              const isSelected = selectedIncomeSource === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => updateFormData({ incomeSource: opt.key })}
                  style={[styles.incomeSourceButton, isSelected && styles.incomeSourceButtonSelected]}
                >
                  <Text style={[
                    styles.incomeSourceLabel,
                    isSelected && styles.incomeSourceLabelSelected,
                  ]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.incomeSourceDesc}>{opt.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>
      </FadeInView>

      {/* ── Extended Family Obligations ── */}
      <FadeInView active={isActive} delay={450}>
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={18} color={WZ.neonPurple} />
            <Text style={styles.sectionTitle}>{t('step1.extendedFamilyObligations')}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {t('step1.extendedFamilyDesc')}
          </Text>

          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => updateFormData({ extendedFamilyObligations: true })}
              style={[styles.toggleButton, extendedFamily && styles.toggleButtonSelectedPurple]}
            >
              <Text style={[
                styles.toggleButtonText,
                extendedFamily && styles.toggleButtonTextSelected,
              ]}>
                {t('step1.yes')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => updateFormData({ extendedFamilyObligations: false })}
              style={[styles.toggleButton, !extendedFamily && styles.toggleButtonSelected]}
            >
              <Text style={[
                styles.toggleButtonText,
                !extendedFamily && styles.toggleButtonTextSelected,
              ]}>
                {t('step1.no')}
              </Text>
            </Pressable>
          </View>
        </GlassCard>
      </FadeInView>

      {/* ── Tip ── */}
      <FadeInView active={isActive} delay={500}>
        <TipBox
          text={t('step1.tip')}
          style={styles.tipBox}
        />
      </FadeInView>
    </ScrollView>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },

  // Sections
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: WZ.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: WZ.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },

  // Profile grid (3x3)
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  profileButton: {
    width: '30%' as any,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: WZ.border,
    backgroundColor: WZ.darkBgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonSelected: {
    borderColor: WZ.accent,
    backgroundColor: 'rgba(251, 189, 35, 0.12)',
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: WZ.textSecondary,
    textAlign: 'center',
  },
  profileButtonTextSelected: {
    color: WZ.accent,
    fontWeight: '700',
  },

  // Situation toggle row
  situationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  situationButton: {
    flex: 1,
    minWidth: '45%' as any,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: WZ.border,
    backgroundColor: WZ.darkBgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  situationButtonSelected: {
    borderColor: WZ.accent,
    backgroundColor: 'rgba(251, 189, 35, 0.12)',
  },
  situationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: WZ.textSecondary,
  },
  situationButtonTextSelected: {
    color: WZ.accent,
    fontWeight: '700',
  },

  // Input row (Age + Dependents side by side)
  inputRow: {
    flexDirection: 'row',
    gap: 14,
  },
  inputGroup: {
    flex: 1,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: WZ.textPrimary,
  },
  textInput: {
    backgroundColor: WZ.darkBgAlt,
    borderWidth: 1.5,
    borderColor: WZ.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: WZ.textPrimary,
    fontWeight: '600',
  },

  // Section header with icon
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Country selector
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WZ.darkBgAlt,
    borderWidth: 1.5,
    borderColor: WZ.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  countrySelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: WZ.accent,
  },
  countryList: {
    gap: 12,
    marginTop: 4,
  },
  countryGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: WZ.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WZ.border,
    backgroundColor: WZ.darkBgAlt,
  },
  countryButtonSelected: {
    borderColor: WZ.accent,
    backgroundColor: 'rgba(251, 189, 35, 0.12)',
  },
  countryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: WZ.textSecondary,
  },
  countryButtonTextSelected: {
    color: WZ.accent,
    fontWeight: '700',
  },

  // Toggle row (Urban/Rural, Yes/No)
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: WZ.border,
    backgroundColor: WZ.darkBgAlt,
  },
  toggleButtonSelected: {
    borderColor: WZ.accent,
    backgroundColor: 'rgba(251, 189, 35, 0.12)',
  },
  toggleButtonSelectedPurple: {
    borderColor: WZ.neonPurple,
    backgroundColor: 'rgba(217, 161, 27, 0.12)',
  },
  toggleIcon: {
    fontSize: 18,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: WZ.textSecondary,
  },
  toggleButtonTextSelected: {
    color: WZ.accent,
    fontWeight: '700',
  },

  // Income source grid (2x2)
  incomeSourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  incomeSourceButton: {
    width: '47%' as any,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: WZ.border,
    backgroundColor: WZ.darkBgAlt,
    gap: 4,
  },
  incomeSourceButtonSelected: {
    borderColor: WZ.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.10)',
  },
  incomeSourceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: WZ.textSecondary,
  },
  incomeSourceLabelSelected: {
    color: WZ.gold,
  },
  incomeSourceDesc: {
    fontSize: 11,
    color: WZ.textMuted,
    lineHeight: 14,
  },

  // Tip box
  tipBox: {
    marginTop: 4,
  },

  // Demo button
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D9A11B',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(217, 161, 27, 0.08)',
  },
  demoButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D9A11B',
  },
});
