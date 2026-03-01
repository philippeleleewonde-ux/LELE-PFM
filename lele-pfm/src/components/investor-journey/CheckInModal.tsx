import React, { useState, useMemo } from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { X, TrendingUp, TrendingDown } from 'lucide-react-native';
import { PF } from '@/components/performance/shared';
import { SelectedAsset, CheckInRecord, AssetSnapshot } from '@/types/investor-journey';

interface CheckInModalProps {
  visible: boolean;
  onClose: () => void;
  assets: SelectedAsset[];
  onSubmit: (checkIn: CheckInRecord) => void;
}

interface AssetEntry {
  assetId: string;
  name: string;
  invested: string;
  currentValue: string;
}

export function CheckInModal({ visible, onClose, assets, onSubmit }: CheckInModalProps) {
  const [entries, setEntries] = useState<AssetEntry[]>(() =>
    assets.map((a) => ({
      assetId: a.id,
      name: a.name,
      invested: '',
      currentValue: '',
    })),
  );
  const [notes, setNotes] = useState('');
  const { width } = useWindowDimensions();
  const isNarrow = width < 500;

  const updateEntry = (idx: number, field: 'invested' | 'currentValue', value: string) => {
    // Allow only numeric input with optional decimal
    const cleaned = value.replace(/[^0-9.]/g, '');
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: cleaned };
      return next;
    });
  };

  const computePerformance = (invested: string, current: string): number => {
    const inv = parseFloat(invested) || 0;
    const cur = parseFloat(current) || 0;
    if (inv <= 0) return 0;
    return ((cur - inv) / inv) * 100;
  };

  const totals = useMemo(() => {
    let totalInvested = 0;
    let totalValue = 0;
    for (const e of entries) {
      totalInvested += parseFloat(e.invested) || 0;
      totalValue += parseFloat(e.currentValue) || 0;
    }
    const perf = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
    return { totalInvested, totalValue, perf };
  }, [entries]);

  const handleSubmit = () => {
    const snapshots: AssetSnapshot[] = entries.map((e) => {
      const inv = parseFloat(e.invested) || 0;
      const cur = parseFloat(e.currentValue) || 0;
      const asset = assets.find((a) => a.id === e.assetId);
      return {
        assetId: e.assetId,
        assetClass: asset?.assetClass ?? 'savings_account',
        name: e.name,
        currentValue: cur,
        amountInvested: inv,
        performance: inv > 0 ? Math.round(((cur - inv) / inv) * 10000) / 100 : 0,
      };
    });

    const checkIn: CheckInRecord = {
      id: `ci_${Date.now()}`,
      date: new Date().toISOString(),
      status: 'completed',
      assetSnapshots: snapshots,
      totalPortfolioValue: Math.round(totals.totalValue),
      totalInvested: Math.round(totals.totalInvested),
      overallPerformance: Math.round(totals.perf * 100) / 100,
      notes: notes.trim() || undefined,
    };

    onSubmit(checkIn);
    // Reset state
    setEntries(
      assets.map((a) => ({
        assetId: a.id,
        name: a.name,
        invested: '',
        currentValue: '',
      })),
    );
    setNotes('');
    onClose();
  };

  const isValid = entries.some(
    (e) => (parseFloat(e.invested) || 0) > 0 && (parseFloat(e.currentValue) || 0) > 0,
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { padding: isNarrow ? 14 : 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bilan portefeuille</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={PF.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {entries.map((entry, idx) => {
              const perf = computePerformance(entry.invested, entry.currentValue);
              const isPositive = perf >= 0;

              return (
                <View key={entry.assetId} style={styles.assetCard}>
                  <Text style={styles.assetName}>{entry.name}</Text>

                  <View style={[styles.inputRow, { flexDirection: isNarrow ? 'column' : 'row' }]}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Montant investi</Text>
                      <TextInput
                        style={styles.input}
                        value={entry.invested}
                        onChangeText={(v) => updateEntry(idx, 'invested', v)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={PF.textMuted}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Valeur actuelle</Text>
                      <TextInput
                        style={styles.input}
                        value={entry.currentValue}
                        onChangeText={(v) => updateEntry(idx, 'currentValue', v)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={PF.textMuted}
                      />
                    </View>
                  </View>

                  {(parseFloat(entry.invested) || 0) > 0 && (
                    <View style={styles.perfRow}>
                      {isPositive ? (
                        <TrendingUp size={14} color={PF.green} />
                      ) : (
                        <TrendingDown size={14} color={PF.red} />
                      )}
                      <Text style={[styles.perfText, { color: isPositive ? PF.green : PF.red }]}>
                        {isPositive ? '+' : ''}{perf.toFixed(2)}%
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Total */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Valeur totale du portefeuille</Text>
              <Text style={styles.totalValue}>
                {totals.totalValue.toLocaleString()} FCFA
              </Text>
              <View style={styles.perfRow}>
                <Text style={styles.totalSubLabel}>Investi : {totals.totalInvested.toLocaleString()} FCFA</Text>
                <Text
                  style={[
                    styles.totalPerf,
                    { color: totals.perf >= 0 ? PF.green : PF.red },
                  ]}
                >
                  {totals.perf >= 0 ? '+' : ''}{totals.perf.toFixed(2)}%
                </Text>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesContainer}>
              <Text style={styles.inputLabel}>Notes (optionnel)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Remarques, observations..."
                placeholderTextColor={PF.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid}
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          >
            <Text style={styles.submitText}>Enregistrer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1C23',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: PF.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    marginBottom: 12,
  },
  assetCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: PF.border,
  },
  assetName: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputRow: {
    gap: 10,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: PF.border,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  perfText: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PF.accent + '30',
  },
  totalLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  totalValue: {
    color: PF.accent,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  totalSubLabel: {
    color: PF.textMuted,
    fontSize: 12,
    flex: 1,
  },
  totalPerf: {
    fontSize: 14,
    fontWeight: '700',
  },
  notesContainer: {
    marginBottom: 8,
    gap: 4,
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: PF.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: PF.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: PF.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#0F1014',
    fontSize: 15,
    fontWeight: '700',
  },
});
