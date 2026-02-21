import React, { useState } from 'react';
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

const CURRENCIES = [
  { code: 'FCFA', label: 'Franc CFA' },
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'Dollar US' },
  { code: 'GBP', label: 'Livre sterling' },
  { code: 'CHF', label: 'Franc suisse' },
  { code: 'MAD', label: 'Dirham marocain' },
  { code: 'TND', label: 'Dinar tunisien' },
  { code: 'DZD', label: 'Dinar algérien' },
  { code: 'NGN', label: 'Naira' },
  { code: 'GHS', label: 'Cedi' },
  { code: 'KES', label: 'Shilling kenyan' },
  { code: 'ZAR', label: 'Rand' },
  { code: 'CDF', label: 'Franc congolais' },
  { code: 'GNF', label: 'Franc guinéen' },
  { code: 'CAD', label: 'Dollar canadien' },
  { code: 'BRL', label: 'Real brésilien' },
  { code: 'INR', label: 'Roupie indienne' },
  { code: 'HTG', label: 'Gourde haïtienne' },
];

// ─── Constants ───

const PROFILES = [
  'Salarié',
  'Indépendant',
  'Fonctionnaire',
  'Étudiant',
  'Retraité',
  'Entrepreneur',
  'Intérimaire',
  'Auto-entrepreneur',
  'Sans emploi',
  'Cadre',
  'Profession libérale',
  'Agriculteur',
] as const;

const SITUATIONS = [
  'Célibataire',
  'En couple',
  'Pacsé(e)',
  'Marié(e)',
  'Séparé(e)',
  'Divorcé(e)',
  'Veuf/Veuve',
] as const;

// Pays regroupés par région pour le sélecteur
const COUNTRY_GROUPS: Array<{ label: string; codes: string[] }> = [
  { label: 'Afrique de l\'Ouest', codes: ['CI', 'SN', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GW'] },
  { label: 'Afrique Centrale', codes: ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ'] },
  { label: 'Afrique (autres)', codes: ['NG', 'GH', 'KE', 'ZA', 'CD', 'GN', 'ET', 'TZ', 'RW'] },
  { label: 'Maghreb', codes: ['MA', 'TN', 'DZ'] },
  { label: 'Europe', codes: ['FR', 'BE', 'CH', 'DE', 'GB', 'IT', 'ES', 'PT'] },
  { label: 'Amériques', codes: ['US', 'CA', 'BR', 'MX', 'HT'] },
  { label: 'Asie & Moyen-Orient', codes: ['IN', 'CN', 'JP', 'VN', 'PH', 'BD', 'PK', 'LB', 'AE', 'SA'] },
];

const URBAN_RURAL_OPTIONS = [
  { key: 'urban' as const, label: 'Urbain', icon: '🏙️' },
  { key: 'rural' as const, label: 'Rural', icon: '🌾' },
];

const INCOME_SOURCE_OPTIONS = [
  { key: 'formal' as const, label: 'Formel', desc: 'Salaire fixe, contrat' },
  { key: 'mixed' as const, label: 'Mixte', desc: 'Salaire + activité annexe' },
  { key: 'informal' as const, label: 'Informel', desc: 'Commerce, artisanat' },
  { key: 'seasonal' as const, label: 'Saisonnier', desc: 'Agriculture, BTP' },
];

// ─── Component ───

interface Step1ProfileProps {
  isActive: boolean;
}

export default function Step1Profile({ isActive }: Step1ProfileProps) {
  const { formData, updateFormData } = useWizardStore();
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
          <Text style={styles.demoButtonText}>Donnees de demo</Text>
        </Pressable>
      </FadeInView>

      {/* ── Professional Profile ── */}
      <FadeInView active={isActive} delay={0}>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Profil professionnel</Text>
          <Text style={styles.sectionSubtitle}>
            Sélectionnez votre situation professionnelle actuelle
          </Text>

          <View style={styles.profileGrid}>
            {PROFILES.map((profile) => {
              const isSelected = selectedJob === profile;
              return (
                <Pressable
                  key={profile}
                  onPress={() => updateFormData({ job: profile })}
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
                    {profile}
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
          <Text style={styles.sectionTitle}>Situation familiale</Text>

          <View style={styles.situationRow}>
            {SITUATIONS.map((situation) => {
              const isSelected = selectedSituation === situation;
              return (
                <Pressable
                  key={situation}
                  onPress={() => updateFormData({ situation })}
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
                    {situation}
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
              <Text style={styles.inputLabel}>Âge</Text>
              <TextInput
                style={styles.textInput}
                value={age}
                onChangeText={(value) => updateFormData({ age: value })}
                placeholder="Ex: 32"
                placeholderTextColor={WZ.textMuted}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Dependents */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Personnes à charge</Text>
              <TextInput
                style={styles.textInput}
                value={dependents}
                onChangeText={(value) => updateFormData({ dependents: value })}
                placeholder="Ex: 2"
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
            <Text style={styles.sectionTitle}>Pays de résidence</Text>
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
            <Text style={styles.sectionTitle}>Devise</Text>
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
            <Text style={styles.sectionTitle}>Zone de résidence</Text>
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
            <Text style={styles.sectionTitle}>Source principale de revenus</Text>
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
            <Text style={styles.sectionTitle}>Obligations familiales élargies</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Participez-vous à des tontines, envois d'argent à la famille élargie, ou autres solidarités communautaires ?
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
                Oui
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
                Non
              </Text>
            </Pressable>
          </View>
        </GlassCard>
      </FadeInView>

      {/* ── Tip ── */}
      <FadeInView active={isActive} delay={500}>
        <TipBox
          text="Ces informations permettent de personnaliser vos recommandations financières et d'adapter les calculs à votre situation réelle, où que vous soyez dans le monde."
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
