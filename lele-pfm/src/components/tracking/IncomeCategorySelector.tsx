import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { INCOME_CATEGORIES, INCOME_CODES, IncomeCode } from '@/constants/income-categories';

interface IncomeCategorySelectorProps {
  selected: IncomeCode | null;
  onSelect: (code: IncomeCode) => void;
}

export function IncomeCategorySelector({ selected, onSelect }: IncomeCategorySelectorProps) {
  return (
    <View style={styles.grid}>
      {INCOME_CODES.map((code) => {
        const cat = INCOME_CATEGORIES[code];
        const isSelected = selected === code;
        const Icon = cat.icon;
        return (
          <Pressable
            key={code}
            onPress={() => onSelect(code)}
            style={[
              styles.button,
              { backgroundColor: isSelected ? `${cat.color}20` : 'rgba(255,255,255,0.05)' },
              isSelected && { borderColor: '#4ADE80', borderWidth: 2 },
            ]}
          >
            <Icon size={22} color={isSelected ? '#4ADE80' : cat.color} />
            <Text
              style={[
                styles.label,
                { color: isSelected ? '#4ADE80' : '#A1A1AA' },
              ]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  button: {
    width: 94,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
