import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Crown, Target, ChevronLeft } from 'lucide-react-native';
import { useEngineStore } from '@/stores/engine-store';

interface ModeSelectorProps {
  label: string;
  amount: number;
  onSelectWealth: () => void;
  onSelectControl: () => void;
  onBack: () => void;
}

function formatAmount(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function ModeSelector({ label, amount, onSelectWealth, onSelectControl, onBack }: ModeSelectorProps) {
  const currency = useEngineStore((s) => s.currency) || 'FCFA';

  return (
    <View style={styles.container}>
      <Text style={styles.purchaseLabel} numberOfLines={1}>
        {label} — {formatAmount(amount)} {currency}
      </Text>

      <Text style={styles.question}>Quel est ton objectif ?</Text>

      {/* Wealth card */}
      <Pressable onPress={onSelectWealth} style={[styles.card, styles.cardWealth]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(251,189,35,0.15)' }]}>
            <Crown size={22} color="#FBBF24" />
          </View>
          <Text style={[styles.cardTitle, { color: '#FBBF24' }]}>
            Je veux devenir riche
          </Text>
        </View>
        <Text style={styles.cardDesc}>
          Verifier si tu peux te l'offrir 10 fois
        </Text>
      </Pressable>

      {/* Control card */}
      <Pressable onPress={onSelectControl} style={[styles.card, styles.cardControl]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(167,139,250,0.15)' }]}>
            <Target size={22} color="#A78BFA" />
          </View>
          <Text style={[styles.cardTitle, { color: '#A78BFA' }]}>
            Je veux maitriser mes depenses
          </Text>
        </View>
        <Text style={styles.cardDesc}>
          Simuler l'impact sur ton budget
        </Text>
      </Pressable>

      <Pressable onPress={onBack} style={styles.backBtn}>
        <ChevronLeft size={16} color="#A1A1AA" />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  purchaseLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  question: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardWealth: {
    backgroundColor: 'rgba(251,189,35,0.06)',
    borderColor: 'rgba(251,189,35,0.25)',
  },
  cardControl: {
    backgroundColor: 'rgba(167,139,250,0.06)',
    borderColor: 'rgba(167,139,250,0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  cardDesc: {
    color: '#71717A',
    fontSize: 13,
    marginLeft: 46,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
  },
  backText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
});
