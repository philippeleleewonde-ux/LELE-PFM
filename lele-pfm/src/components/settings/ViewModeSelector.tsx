import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewMode } from '@/stores/app.store';
import { useInvestmentStore } from '@/stores/investment-store';
import { InvestorProfileSheet } from '@/components/investment/InvestorProfileSheet';

interface ModeOption {
  mode: ViewMode;
  emoji: string;
  label: string;
  subtitle: string;
  color: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'simple',
    emoji: '\u{1F7E2}',
    label: 'Essentiel',
    subtitle: 'Suivi simplifié de vos finances',
    color: '#4ADE80',
  },
  {
    mode: 'expert',
    emoji: '\u{1F535}',
    label: 'Avancé',
    subtitle: 'Toutes les métriques et analyses',
    color: '#60A5FA',
  },
  {
    mode: 'investor',
    emoji: '\u{1F7E1}',
    label: 'Placement',
    subtitle: 'Économies + projections investissement',
    color: '#FBBF24',
  },
];

export function ViewModeSelector() {
  const { viewMode, setViewMode } = useViewMode();
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const handleSelect = (mode: ViewMode) => {
    setViewMode(mode);
    // Auto-trigger investor profile setup when switching to Placement without a profile
    if (mode === 'investor' && !investorProfile) {
      setShowProfileSheet(true);
    }
  };

  return (
    <View style={styles.container}>
      {MODE_OPTIONS.map((opt) => {
        const isActive = viewMode === opt.mode;
        return (
          <Pressable
            key={opt.mode}
            onPress={() => handleSelect(opt.mode)}
            style={[
              styles.card,
              isActive && { borderColor: opt.color + '80' },
            ]}
          >
            <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={
                isActive
                  ? [opt.color + '15', opt.color + '05']
                  : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardContent}>
              <View style={styles.topRow}>
                <Text style={styles.emoji}>{opt.emoji}</Text>
                <Text style={[styles.label, isActive && { color: opt.color }]}>
                  {opt.label}
                </Text>
              </View>
              <Text style={[styles.subtitle, isActive && { color: '#E4E4E7' }]}>
                {opt.subtitle}
              </Text>
              {isActive && (
                <View style={[styles.activeDot, { backgroundColor: opt.color }]} />
              )}
            </View>
          </Pressable>
        );
      })}

      <InvestorProfileSheet
        visible={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
  },
  cardContent: {
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    color: '#E4E4E7',
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: '#71717A',
    fontSize: 12,
    marginLeft: 24,
  },
  activeDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
