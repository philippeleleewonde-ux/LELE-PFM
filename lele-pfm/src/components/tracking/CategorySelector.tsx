import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBasket,
  Shirt,
  Home,
  HeartPulse,
  Car,
  Phone,
  Film,
  BookOpen,
} from 'lucide-react-native';
import { COICOPCode } from '@/types';

/** labelKey resolves via t(`app:categories.${labelKey}`) */
const CATEGORIES: { code: COICOPCode; labelKey: string; icon: typeof ShoppingBasket; color: string }[] = [
  { code: '01', labelKey: 'food', icon: ShoppingBasket, color: '#4ADE80' },
  { code: '02', labelKey: 'clothing', icon: Shirt, color: '#F472B6' },
  { code: '03', labelKey: 'housing', icon: Home, color: '#60A5FA' },
  { code: '04', labelKey: 'health', icon: HeartPulse, color: '#F87171' },
  { code: '05', labelKey: 'transport', icon: Car, color: '#FBBF24' },
  { code: '06', labelKey: 'telecom', icon: Phone, color: '#A78BFA' },
  { code: '07', labelKey: 'leisure', icon: Film, color: '#FB923C' },
  { code: '08', labelKey: 'education', icon: BookOpen, color: '#34D399' },
];

interface CategorySelectorProps {
  selected: COICOPCode | null;
  onSelect: (code: COICOPCode) => void;
}

export function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
  const { t } = useTranslation('app');
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.code;
        const Icon = cat.icon;
        return (
          <Pressable
            key={cat.code}
            onPress={() => onSelect(cat.code)}
            style={[
              styles.button,
              { backgroundColor: isSelected ? `${cat.color}20` : 'rgba(255,255,255,0.05)' },
              isSelected && { borderColor: '#FBBF24', borderWidth: 2 },
            ]}
          >
            <Icon size={22} color={isSelected ? '#FBBF24' : cat.color} />
            <Text
              style={[
                styles.label,
                { color: isSelected ? '#FBBF24' : '#A1A1AA' },
              ]}
              numberOfLines={1}
            >
              {t(`categories.${cat.labelKey}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { CATEGORIES as CATEGORY_CONFIGS };

/** Use with t(`app:categories.${labelKey}`) to get translated label */
export const CATEGORY_COLOR_MAP: Record<string, { labelKey: string; color: string }> =
  Object.fromEntries(CATEGORIES.map(c => [c.code, { labelKey: c.labelKey, color: c.color }])) as Record<string, { labelKey: string; color: string }>;

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
