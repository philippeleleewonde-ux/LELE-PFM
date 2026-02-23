import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Shield, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AmountInput } from '@/components/tracking/AmountInput';

interface PurchaseInputProps {
  label: string;
  amount: number;
  onLabelChange: (text: string) => void;
  onAmountChange: (amount: number) => void;
  onNext: () => void;
}

export function PurchaseInput({ label, amount, onLabelChange, onAmountChange, onNext }: PurchaseInputProps) {
  const { t } = useTranslation('app');
  const isValid = label.trim().length > 0 && amount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <View style={styles.iconCircle}>
          <Shield size={24} color="#A78BFA" />
        </View>
        <Text style={styles.title}>{t('impulse.title')}</Text>
      </View>

      <Text style={styles.sectionLabel}>{t('impulse.whatToBuy')}</Text>
      <TextInput
        style={styles.textInput}
        value={label}
        onChangeText={onLabelChange}
        placeholder={t('impulse.placeholder')}
        placeholderTextColor="#52525B"
        returnKeyType="next"
      />

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('impulse.howMuch')}</Text>
      <AmountInput value={amount} onChange={onAmountChange} />

      <Pressable
        onPress={onNext}
        disabled={!isValid}
        style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
      >
        <Text style={[styles.nextBtnText, !isValid && styles.nextBtnTextDisabled]}>
          {t('impulse.analyze')}
        </Text>
        <ChevronRight size={18} color={isValid ? '#0F1014' : '#52525B'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(167,139,250,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 50,
    color: '#FFFFFF',
    fontSize: 15,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#A78BFA',
  },
  nextBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nextBtnText: {
    color: '#0F1014',
    fontSize: 16,
    fontWeight: '800',
  },
  nextBtnTextDisabled: {
    color: '#52525B',
  },
});
