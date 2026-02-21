import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useEngineStore } from '@/stores/engine-store';

interface AmountInputProps {
  value: number;
  onChange: (amount: number) => void;
}

export function AmountInput({ value, onChange }: AmountInputProps) {
  const currency = useEngineStore((s) => s.currency);
  const [rawText, setRawText] = useState(value > 0 ? String(value) : '');

  // Sync rawText when value prop changes externally (e.g. modal reset to 0)
  useEffect(() => {
    setRawText(value > 0 ? String(value) : '');
  }, [value]);

  const handleChange = useCallback(
    (text: string) => {
      // Strip non-numeric characters
      const cleaned = text.replace(/[^0-9]/g, '');
      setRawText(cleaned);
      const num = parseInt(cleaned, 10);
      onChange(isNaN(num) ? 0 : num);
    },
    [onChange]
  );

  // Format display with thousands separators
  const displayValue = rawText
    ? parseInt(rawText, 10)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : '';

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={displayValue}
        onChangeText={handleChange}
        placeholder="0"
        placeholderTextColor="#52525B"
        keyboardType="numeric"
        returnKeyType="done"
      />
      <View style={styles.currencyBadge}>
        <Text style={styles.currencyText}>{currency || 'FCFA'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  currencyBadge: {
    backgroundColor: 'rgba(251,189,35,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currencyText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '600',
  },
});
